<template>
    <div class="custom-roller-container">
        <div class="dice-types-row">
            <div v-for="dieType in DIE_TYPES" :key="dieType" class="dice-column"
                :class="{ 'dice-column--active': diceCounts[dieType] > 0 }">
                <i :class="getDiceFontMaxClass(dieType)" class="die-icon"></i>
                <NumberInput :model-value="diceCounts[dieType]" @update:model-value="updateDiceCount(dieType, $event)"
                    :min="0" :max="20" :size="NUMBER_INPUT_SIZES.MEDIUM" />
            </div>
        </div>

        <div class="controls-row">
            <div class="modifier-control"
                :class="{ 'modifier-control--positive': modifier > 0, 'modifier-control--negative': modifier < 0 }">
                <span class="modifier-label">Modifier</span>
                <NumberInput :model-value="modifier" @update:model-value="modifier = $event"
                    :size="NUMBER_INPUT_SIZES.MEDIUM" />
            </div>

            <div class="action-buttons">
                <ActionButton variant="primary" size="large" text="Roll" :disabled="!hasAnyDice || isRolling"
                    @click="handleRoll" />
                <ActionButton variant="neutral" size="large" text="Clear" :disabled="!hasAnyDice && modifier === 0"
                    @click="clearAllDice" />
            </div>
        </div>

        <label class="discord-toggle" for="custom-send-to-discord">
            <input id="custom-send-to-discord" v-model="sendToDiscord" type="checkbox" />
            <span>Send to Discord</span>
        </label>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'
import { CORE_ABILITIES } from '@shared/constants/characterConstants'
import CustomRollService from '@/services/rolls/customRollService'
import DamageRollService from '@/services/rolls/damageRollService'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()

const props = defineProps({
    character: { type: Object, default: null },
    initialDiceCounts: { type: Object, default: () => ({}) },
    initialModifier: { type: Number, default: 0 },
    rollMode: { type: String, default: 'custom' }, // 'custom' | 'damage'
    rollName: { type: String, default: '' },
    sourceName: { type: String, default: '' },
})

const emit = defineEmits(['roll-complete'])

const DIE_TYPES = STANDARD_DIE_SIZES
const MAX_DICE_PER_TYPE = 20
const ROLL_DELAY_MS = 500

const diceCounts = ref({})
const isRolling = ref(false)
const sendToDiscord = ref(true)

// Initialize dice counts from prop (or 0)
DIE_TYPES.forEach(dieType => {
    diceCounts.value[dieType] = props.initialDiceCounts[dieType] || 0
})

const modifier = ref(props.initialModifier)

const hasAnyDice = computed(() => {
    return Object.values(diceCounts.value).some(count => count > 0)
})

const updateDiceCount = (dieType, count) => {
    const validCount = Math.max(0, Math.min(MAX_DICE_PER_TYPE, count || 0))
    diceCounts.value[dieType] = validCount
}

const clearAllDice = () => {
    DIE_TYPES.forEach(dieType => {
        diceCounts.value[dieType] = 0
    })
    modifier.value = 0
}

const handleRoll = async () => {
    if (!hasAnyDice.value || isRolling.value) return

    isRolling.value = true

    try {
        const dicePool = []
        Object.entries(diceCounts.value).forEach(([dieType, count]) => {
            for (let i = 0; i < count; i++) {
                dicePool.push({ dieSize: parseInt(dieType) })
            }
        })

        // Use explicit character prop if provided, otherwise fall back to selected character
        const character = props.character || charactersStore.selectedCharacter
        const resolvedCharacter = character || { name: 'Unknown Character', featuredArtUrls: [''] }

        let rollResult
        if (props.rollMode === 'damage') {
            rollResult = DamageRollService.makeDamageRoll(
                dicePool,
                modifier.value,
                resolvedCharacter,
                {
                    rollName: props.rollName || 'Damage Roll',
                    baseSkillName: props.rollName || 'Damage Roll',
                    sourceName: props.sourceName || null,
                    modifierLabel: CORE_ABILITIES.BODY.label,
                    footer: `+ ${CORE_ABILITIES.BODY.label}`,
                    sendToDiscord: sendToDiscord.value,
                }
            )
        } else {
            rollResult = CustomRollService.makeCustomRoll(
                dicePool,
                modifier.value,
                resolvedCharacter,
                { sendToDiscord: sendToDiscord.value }
            )
        }

        if (rollResult) {
            rollsStore.setRoll(rollResult)
        }
        emit('roll-complete')
    } catch (error) {
        console.error('Error making custom roll:', error)
    } finally {
        setTimeout(() => {
            isRolling.value = false
        }, ROLL_DELAY_MS)
    }
}
</script>

<style scoped>
.custom-roller-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
}

.dice-types-row {
    display: flex;
    gap: var(--space-sm);
    justify-content: center;
    flex-wrap: wrap;
}

.dice-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
}

.die-icon {
    font-size: var(--font-size-36);
    color: var(--color-gray-light);
    transition: color var(--transition-fast);
}

.dice-column--active .die-icon {
    color: var(--color-primary);
}

.dice-column--active :deep(input[type='number']) {
    border-color: var(--color-primary);
}

.controls-row {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-sm);
}

.modifier-control {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.modifier-label {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    min-width: 50px;
    margin-top: 15px;
}

.modifier-control--positive :deep(input[type='number']) {
    border-color: var(--color-success);
}

.modifier-control--negative :deep(input[type='number']) {
    border-color: var(--color-danger);
}

.action-buttons {
    display: flex;
    gap: var(--space-xs);
}

.discord-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    user-select: none;
}

.discord-toggle input[type="checkbox"] {
    width: 16px;
    height: 16px;
    margin: 0;
}
</style>
