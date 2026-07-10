<template>
    <BaseModal title="Genetics Wizard 🪄" width="min(800px, 90vw)" @close="onCancel">
        <!-- Step indicator -->
        <div class="step-indicator">
            <span v-for="(label, i) in stepLabels" :key="i" class="step-dot" :class="{
                'step-dot--active': i === currentStep,
                'step-dot--done': stepSelections[i] !== null,
            }" :title="label">{{ label }}</span>
        </div>

        <!-- Two-column layout -->
        <div class="genetics-columns">
            <GeneticsAncestryColumn :ancestry="ancestryA" :is-selected="isColumnSelected('a')"
                :is-animating="isAnimating && animatedSide === 'a'" :is-idle="isColumnIdle('a')">
                <template v-if="currentStep === 0">
                    <div class="speed-wrapper">
                        <div class="speed-display">
                            <span class="speed-value">{{ ancestryASpeed }}</span>
                            <span class="speed-label">ft / round</span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="ability-wrapper">
                        <AbilityCard v-if="ancestryAAbilities[currentStep - 1]"
                            :ability="ancestryAAbilities[currentStep - 1]" :collapsed="false" :collapsible="true"
                            :show-xp-badge="false" />
                        <span v-else class="no-ability">No ability</span>
                    </div>
                </template>
            </GeneticsAncestryColumn>

            <GeneticsAncestryColumn :ancestry="ancestryB" :is-selected="isColumnSelected('b')"
                :is-animating="isAnimating && animatedSide === 'b'" :is-idle="isColumnIdle('b')">
                <template v-if="currentStep === 0">
                    <div class="speed-wrapper">
                        <div class="speed-display">
                            <span class="speed-value">{{ ancestryBSpeed }}</span>
                            <span class="speed-label">ft / round</span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="ability-wrapper">
                        <AbilityCard v-if="ancestryBAbilities[currentStep - 1]"
                            :ability="ancestryBAbilities[currentStep - 1]" :collapsed="false" :collapsible="true"
                            :show-xp-badge="false" />
                        <span v-else class="no-ability">No ability</span>
                    </div>
                </template>
            </GeneticsAncestryColumn>
        </div>

        <!-- Current step description -->
        <p class="step-description">{{ stepDescription }}</p>

        <template #actions>
            <div class="wizard-actions">
                <ActionButton variant="neutral" size="large" text="Cancel" @click="onCancel" />
                <ActionButton v-if="!currentStepComplete && !isAnimating" variant="primary" size="large"
                    text="Randomize" @click="startAnimation" />
                <ActionButton v-if="currentStepComplete && !isLastStep" variant="primary" size="large"
                    text="Accept & Next" @click="advanceStep" />
                <ActionButton v-if="currentStepComplete && isLastStep" variant="primary" size="large"
                    text="Accept & Apply All" @click="applyAll" />
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import GeneticsAncestryColumn from './GeneticsAncestryColumn.vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useCharactersStore } from '@/stores/charactersStore'

const props = defineProps({
    ancestryA: {
        type: Object,
        required: true,
    },
    ancestryB: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close'])

const abilitiesStore = useAbilitiesStore()
const charactersStore = useCharactersStore()

// ── Abilities ────────────────────────────────────────────────────────────────

const getAncestryAbilities = (ancestryId) =>
    (abilitiesStore.abilities || [])
        .filter(a => a.source === ancestryId && !a.isDeleted)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 3)

const ancestryAAbilities = computed(() => getAncestryAbilities(props.ancestryA.id))
const ancestryBAbilities = computed(() => getAncestryAbilities(props.ancestryB.id))

// ── Speed ─────────────────────────────────────────────────────────────────────

const ancestryASpeed = computed(() => props.ancestryA.physiology?.speed ?? 30)
const ancestryBSpeed = computed(() => props.ancestryB.physiology?.speed ?? 30)

// ── Step state ───────────────────────────────────────────────────────────────

// Steps: 0 = Speed, 1-3 = Ability 1-3
const STEP_COUNT = 4
const currentStep = ref(0)
// null = not yet chosen, 'a' or 'b' = chosen side
const stepSelections = ref(Array(STEP_COUNT).fill(null))

const stepLabels = ['Speed', 'Ability 1', 'Ability 2', 'Ability 3']

const stepDescription = computed(() => {
    const stepComplete = stepSelections.value[currentStep.value] !== null
    if (stepComplete) {
        const choice = stepSelections.value[currentStep.value]
        const name = choice === 'a' ? props.ancestryA.name : props.ancestryB.name
        if (currentStep.value === 0) return `Speed: ${name}'s speed was selected.`
        return `Ability ${currentStep.value}: ${name}'s ability was selected.`
    }
    if (currentStep.value === 0)
        return 'Randomize to determine which Ancestry sets your character\'s Speed.'
    return `Randomize to determine which Ancestry contributes Ability ${currentStep.value}.`
})

const currentStepComplete = computed(() => stepSelections.value[currentStep.value] !== null)
const isLastStep = computed(() => currentStep.value === STEP_COUNT - 1)

// ── Animation ────────────────────────────────────────────────────────────────

const isAnimating = ref(false)
const animatedSide = ref('a')

let pendingTimeouts = []

const clearPendingTimeouts = () => {
    pendingTimeouts.forEach(id => clearTimeout(id))
    pendingTimeouts = []
}

// Delays in ms, from fast to slow (13 total intervals → odd number so we naturally
// end on the opposite side from where we start, matching finalChoice)
const FLIP_DELAYS = [70, 70, 75, 80, 90, 110, 140, 180, 230, 290, 360, 440, 520]

const startAnimation = () => {
    if (isAnimating.value || currentStepComplete.value) return

    const finalChoice = Math.random() < 0.5 ? 'a' : 'b'
    // Start on the opposite side so the final flip lands on finalChoice naturally
    let currentSide = finalChoice === 'a' ? 'b' : 'a'

    isAnimating.value = true
    animatedSide.value = currentSide

    let accumulated = 0
    FLIP_DELAYS.forEach((delay, i) => {
        accumulated += delay
        const timeoutId = setTimeout(() => {
            currentSide = currentSide === 'a' ? 'b' : 'a'
            animatedSide.value = currentSide

            // Last flip — finalize
            if (i === FLIP_DELAYS.length - 1) {
                animatedSide.value = finalChoice
                isAnimating.value = false
                stepSelections.value[currentStep.value] = finalChoice
            }
        }, accumulated)
        pendingTimeouts.push(timeoutId)
    })
}

// ── Navigation ───────────────────────────────────────────────────────────────

const advanceStep = () => {
    if (!currentStepComplete.value || isLastStep.value) return
    currentStep.value++
}

// ── Apply ─────────────────────────────────────────────────────────────────────

const applyAll = () => {
    const char = charactersStore.selectedCharacter
    if (!char) return

    // Speed
    const speedChoice = stepSelections.value[0]
    if (speedChoice !== null) {
        char.speed = speedChoice === 'a' ? ancestryASpeed.value : ancestryBSpeed.value
    }

    // Abilities (3 pairs)
    for (let i = 1; i <= 3; i++) {
        const choice = stepSelections.value[i]
        if (choice === null) continue

        const ability = choice === 'a'
            ? ancestryAAbilities.value[i - 1]
            : ancestryBAbilities.value[i - 1]

        if (!ability) continue

        if (!char.abilities) char.abilities = []
        const alreadyOwned = char.abilities.some(a => a.id === ability.id)
        if (!alreadyOwned) {
            char.abilities.push({
                id: ability.id,
                collapsed: false,
                showImprovements: false,
                showSuccesses: false,
                isActive: false,
            })
        }
    }

    emit('close')
}

// ── Cancel ────────────────────────────────────────────────────────────────────

const onCancel = () => {
    if (!confirm('Are you sure you want to cancel? Your Genetics Wizard selections will be lost.')) return
    clearPendingTimeouts()
    emit('close')
}

// ── Highlight helpers ────────────────────────────────────────────────────────

const isColumnSelected = (side) => {
    if (isAnimating.value) return animatedSide.value === side
    return stepSelections.value[currentStep.value] === side
}

const isColumnIdle = (side) => {
    const sel = stepSelections.value[currentStep.value]
    if (isAnimating.value) return animatedSide.value !== side
    if (sel === null) return false
    return sel !== side
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

onBeforeUnmount(() => {
    clearPendingTimeouts()
})
</script>

<style scoped>
.step-indicator {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
}

.step-dot {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    transition: all 0.2s ease;
    white-space: nowrap;
}

.step-dot--active {
    color: var(--color-text-primary);
    border-color: var(--color-primary);
    background: var(--overlay-white-subtle);
}

.step-dot--done {
    color: var(--color-accent-gold);
    border-color: var(--color-accent-gold);
}

.step-dot--active.step-dot--done {
    color: var(--color-accent-gold);
    border-color: var(--color-accent-gold);
    background: var(--overlay-white-subtle);
}

.genetics-columns {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
    align-items: stretch;
}

/* Speed step content */
.speed-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.speed-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
}

.speed-value {
    font-size: 3rem;
    font-weight: bold;
    color: var(--color-text-primary);
    line-height: 1;
}

.speed-label {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

/* Ability step content */
.ability-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.no-ability {
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
    font-style: italic;
}

/* Step description */
.step-description {
    text-align: center;
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    font-style: italic;
    margin: 0 0 var(--space-sm);
    min-height: 1.4em;
}

/* Actions footer */
.wizard-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    width: 100%;
}
</style>
