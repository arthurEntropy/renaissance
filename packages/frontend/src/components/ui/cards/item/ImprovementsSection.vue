<template>
    <div class="improvements-section">
        <!-- Always show owned improvements when in character context -->
        <transition name="expand-improvements">
            <div v-if="hasOwnedImprovements" class="improvements-stack">
                <div v-for="(impr) in ownedImprovements" :key="impr.id" class="improvement-desc-block">
                    <div class="improvement-title improvement-owned">{{ impr.name }}</div>
                    <CardDescription v-if="impr.description" :content="impr.description"
                        additional-classes="improvement" @roll-link="emit('roll-link', $event)">
                        <template #badge>
                            <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" :is-owned="true"
                                :isInteractive="isInteractive" :improvement-id="impr.id" :asImprovementBadge="true"
                                @toggle="handleImprovementToggle" />
                        </template>
                    </CardDescription>
                </div>
            </div>
        </transition>

        <!-- Conditionally show un-owned improvements -->
        <transition name="expand-improvements">
            <div v-if="shouldShowUnownedImprovements" class="improvements-stack">
                <div v-for="(impr) in unownedImprovements" :key="impr.id" class="improvement-desc-block">
                    <div class="improvement-title" :class="{ 'improvement-unowned': showImprovementToggle }">{{
                        impr.name }}
                    </div>
                    <CardDescription v-if="impr.description" :content="impr.description"
                        :additional-classes="unownedDescriptionClasses" @roll-link="emit('roll-link', $event)">
                        <template #badge>
                            <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" :isInteractive="isInteractive"
                                :is-owned="isImprovementOwned(impr.id)" :improvement-id="impr.id"
                                :asImprovementBadge="true" @toggle="handleImprovementToggle" />
                        </template>
                    </CardDescription>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useImprovements } from '@/composables/useImprovements'
import CardDescription from '@/components/ui/cards/item/CardDescription.vue'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    // Item type: 'abilities' or 'equipment'
    itemType: {
        type: String,
        required: true,
        validator: (value) => ['abilities', 'equipment'].includes(value)
    },
    // Optional character context for improvement ownership
    character: {
        type: Object,
        default: null
    },
    showImprovementToggle: {
        type: Boolean,
        default: false
    },
    showImprovements: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggle-improvement', 'roll-link'])

// Use improvements composable
const { hasImprovement } = useImprovements(props.itemType)

// Computed properties
const improvements = computed(() => props.item.improvements || [])

const isInteractive = computed(() => props.showImprovementToggle && !!props.character)

// Helper function - must be defined before computed properties that use it
const isImprovementOwned = (improvementId) => {
    if (!props.character || !improvementId) return false
    return hasImprovement(props.character, props.item.id, improvementId)
}

// Partition improvements into owned/un-owned
const partitionedImprovements = computed(() => {
    if (!improvements.value.length) {
        return { ownedImprovements: [], unownedImprovements: [] }
    }

    // In non-character contexts, all improvements are un-owned
    if (!props.showImprovementToggle || !props.character) {
        const sorted = [...improvements.value].sort((a, b) => (a.xp || 0) - (b.xp || 0))
        return { ownedImprovements: [], unownedImprovements: sorted }
    }

    // In character contexts, partition by ownership
    const owned = []
    const unowned = []

    for (const improvement of improvements.value) {
        if (isImprovementOwned(improvement.id)) {
            owned.push(improvement)
        } else {
            unowned.push(improvement)
        }
    }

    // Sort both arrays by XP
    owned.sort((a, b) => (a.xp || 0) - (b.xp || 0))
    unowned.sort((a, b) => (a.xp || 0) - (b.xp || 0))

    return { ownedImprovements: owned, unownedImprovements: unowned }
})

const ownedImprovements = computed(() => partitionedImprovements.value.ownedImprovements)
const unownedImprovements = computed(() => partitionedImprovements.value.unownedImprovements)

const hasOwnedImprovements = computed(() => {
    return props.showImprovementToggle && ownedImprovements.value.length > 0
})

const shouldShowUnownedImprovements = computed(() => {
    // In character context: show unowned improvements only when toggle is enabled
    if (props.showImprovementToggle) {
        return unownedImprovements.value.length > 0 && props.showImprovements
    }

    // In non-character context: show all improvements when enabled (read-only)
    return improvements.value.length > 0 && props.showImprovements
})

// Dynamic classes based on ownership
const unownedDescriptionClasses = computed(() => {
    const classes = ['improvement']
    if (props.showImprovementToggle) {
        classes.push('improvement-unowned')
    }
    return classes.join(' ')
})

// Methods
const handleImprovementToggle = (improvementId) => {
    emit('toggle-improvement', improvementId)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.improvements-stack {
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
    text-align: left;
    transition: var(--transition-color);
    -webkit-text-stroke: 3px var(--color-black);
    -webkit-text-fill-color: var(--color-text-primary);
    paint-order: stroke fill;
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

:deep(.improvement-badge-unowned) {
    background-color: var(--color-primary-hover) !important;
    transition: var(--transition-background);
}

.improvement-desc-block:hover :deep(.improvement-badge-unowned) {
    background-color: var(--color-primary) !important;
}

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
    transform: translateY(0);
}
</style>