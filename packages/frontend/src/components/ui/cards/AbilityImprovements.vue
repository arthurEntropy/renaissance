<template>
    <div class="ability-improvements">
        <!-- Always show owned improvements when in character context -->
        <transition name="expand-improvements">
            <div v-if="hasOwnedImprovements" class="improvements-pile">
                <div v-for="(impr) in ownedImprovements" :key="impr.id || impr.title" class="improvement-desc-block">
                    <div class="improvement-title improvement-owned">{{ impr.name }}</div>
                    <CardDescription v-if="impr.description" :content="impr.description"
                        additional-classes="improvement">
                        <template #overlay>
                            <AddAbilityOverlay v-if="showAddOverlays" :ability-id="abilityId" :improvement-id="impr.id"
                                @update:character="handleCharacterUpdate" />
                        </template>
                    </CardDescription>
                </div>
            </div>
        </transition>

        <!-- Conditionally show unowned improvements -->
        <transition name="expand-improvements">
            <div v-if="shouldShowUnownedImprovements" class="improvements-pile">
                <div v-for="(impr) in unownedImprovements" :key="impr.id || impr.title" class="improvement-desc-block">
                    <div class="improvement-title" :class="{ 'improvement-unowned': showImprovementToggle }">{{
                        impr.name }}
                    </div>
                    <CardDescription v-if="impr.description" :content="impr.description"
                        :additional-classes="getUnownedDescriptionClasses()">
                        <template #badge>
                            <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" position="bottom-left"
                                :custom-class="getUnownedBadgeClasses()" :interactive="isInteractive" :is-owned="false"
                                :improvement-id="impr.id" @toggle="handleImprovementToggle" />
                        </template>
                        <template #overlay>
                            <AddAbilityOverlay v-if="showAddOverlays" :ability-id="abilityId" :improvement-id="impr.id"
                                @update:character="handleCharacterUpdate" />
                        </template>
                    </CardDescription>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAbilityImprovements } from '@/composables/useAbilityImprovements'
import CardDescription from '@/components/ui/cards/CardDescription.vue'
import BadgeDisplay from '@/components/ui/cards/BadgeDisplay.vue'
import AddAbilityOverlay from '@/components/ui/cards/AddAbilityOverlay.vue'

const props = defineProps({
    improvements: {
        type: Array,
        default: () => []
    },
    character: {
        type: Object,
        default: null
    },
    abilityId: {
        type: String,
        required: true
    },
    showImprovementToggle: {
        type: Boolean,
        default: false
    },
    showImprovements: {
        type: Boolean,
        default: false
    },
    showAddOverlays: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggle-improvement', 'update:character'])

// Composable for improvement management
const { hasImprovement } = useAbilityImprovements()

// Computed properties
const isInteractive = computed(() => props.showImprovementToggle && !!props.character)

const ownedImprovements = computed(() => {
    if (!props.improvements.length || !props.showImprovementToggle || !props.character) {
        return []
    }

    return props.improvements
        .filter(improvement => isImprovementOwned(improvement.id))
        .sort((a, b) => (a.xp || 0) - (b.xp || 0))
})

const unownedImprovements = computed(() => {
    if (!props.improvements.length) return []

    // In non-character contexts, show all improvements as unowned
    if (!props.showImprovementToggle || !props.character) {
        return [...props.improvements].sort((a, b) => (a.xp || 0) - (b.xp || 0))
    }

    // In character contexts, only show actual unowned improvements
    return props.improvements
        .filter(improvement => !isImprovementOwned(improvement.id))
        .sort((a, b) => (a.xp || 0) - (b.xp || 0))
})

const hasOwnedImprovements = computed(() => {
    return props.showImprovementToggle && ownedImprovements.value.length > 0
})

const shouldShowUnownedImprovements = computed(() => {
    // In character context: show unowned improvements only when toggle is enabled
    if (props.showImprovementToggle) {
        return unownedImprovements.value.length > 0 && props.showImprovements
    }

    // In non-character context (legacy): show all improvements when enabled
    return props.improvements.length > 0 && props.showImprovements
})

// Methods
const isImprovementOwned = (improvementId) => {
    if (!props.character || !improvementId) return false
    return hasImprovement(props.character, props.abilityId, improvementId)
}

const handleImprovementToggle = (improvementId) => {
    emit('toggle-improvement', improvementId)
}

const handleCharacterUpdate = (updatedCharacter) => {
    emit('update:character', updatedCharacter)
}

const getUnownedDescriptionClasses = () => {
    const classes = ['improvement']
    if (props.showImprovementToggle) {
        classes.push('improvement-unowned')
    }
    return classes.join(' ')
}

const getUnownedBadgeClasses = () => {
    const classes = ['improvement-badge']
    if (props.showImprovementToggle) {
        classes.push('improvement-badge-unowned')
    }
    return classes.join(' ')
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.improvements-pile {
    margin-top: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.improvement-desc-block {
    width: 100%;
    margin: 0;
    padding: 0;
}

.improvement-desc-block:last-child {
    margin-bottom: var(--space-sm);
}

.improvement-title {
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-xs);
    margin-top: var(--space-xs);
    transition: var(--transition-color);
}

.improvement-title.improvement-unowned {
    color: var(--color-text-secondary);
}

.improvement-desc-block:hover .improvement-title.improvement-unowned {
    color: var(--color-text-primary);
}

.improvement-title.improvement-owned {
    color: var(--color-text-primary);
}

:deep(.card-description.improvement.improvement-unowned) {
    color: var(--color-text-secondary);
    transition: var(--transition-color);
}

.improvement-desc-block:hover :deep(.card-description.improvement.improvement-unowned) {
    color: var(--color-text-primary);
}

/* Unowned improvement badge styling */
:deep(.improvement-badge-unowned) {
    background-color: var(--color-bg-tertiary) !important;
    transition: var(--transition-background);
}

/* When hovering over the improvement block (title/description), change badge color */
.improvement-desc-block:hover :deep(.improvement-badge-unowned) {
    background-color: var(--color-primary) !important;
}

/* Improvements expand/collapse transition */
.expand-improvements-enter-active,
.expand-improvements-leave-active {
    transition: all var(--transition-medium);
    overflow: hidden;
}

.expand-improvements-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-20px);
}

.expand-improvements-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    transform: translateY(-10px);
}

.expand-improvements-enter-to,
.expand-improvements-leave-from {
    opacity: 1;
    max-height: 1000px;
    /* Large enough for typical improvements */
    transform: translateY(0);
}
</style>