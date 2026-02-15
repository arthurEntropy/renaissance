<template>
    <div class="dice-group">
        <i v-for="(_, diceIndex) in MAX_SKILL_RANKS" :key="diceIndex" :class="getDiceClasses(diceIndex)"
            @click="handleDiceClick(diceIndex)" @mouseenter="hoveredIndex = diceIndex" @mouseleave="hoveredIndex = null"
            class="dice-icon d6-icon">
        </i>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants'
import { DIE_TYPE } from '@shared/constants/dice'

const props = defineProps({
    skill: {
        type: Object,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update-ranks'])

const hoveredIndex = ref(null)

const handleDiceClick = (diceIndex) => {
    if (!props.canEdit) return

    // Clicking on a die sets the ranks, unless it's already that rank, in which case it removes one rank
    const newRank = diceIndex + 1
    const updatedRanks = newRank === props.skill.ranks ? props.skill.ranks - 1 : newRank
    emit('update-ranks', updatedRanks)
}

const getDiceClasses = (diceIndex) => {
    const { ranks, diceMod = 0, manualDiceMod = 0 } = props.skill
    const totalDiceMod = diceMod + manualDiceMod

    // Determine if we should show hover preview
    const showHoverPreview = props.canEdit && hoveredIndex.value !== null
    const hoveredRank = hoveredIndex.value + 1

    // Preview logic: show ranks up to hovered index
    const withinHoverPreview = showHoverPreview && diceIndex <= hoveredIndex.value

    const withinRanks = diceIndex < ranks
    const withinDiceMod = diceIndex >= ranks && diceIndex < ranks + totalDiceMod && totalDiceMod > 0
    const isActive = withinRanks || withinDiceMod

    const isAdded = withinDiceMod
    const isSubtracted = ranks - diceIndex <= Math.abs(totalDiceMod) && totalDiceMod < 0 && diceIndex < ranks

    return [
        getDiceFontClass(DIE_TYPE.D6, DIE_TYPE.D6),
        {
            'dice-active': isActive,
            'dice-added': isAdded,
            'dice-subtracted': isSubtracted,
            'dice-hover-preview': withinHoverPreview && !isAdded && !isSubtracted,
            'can-edit': props.canEdit
        },
    ]
}
</script>

<style scoped>
.dice-group {
    display: flex;
    gap: var(--space-xs);
    margin: 0 var(--space-xs);
}

.dice-icon {
    font-size: var(--font-size-24);
    transition: var(--transition-color), opacity var(--transition-normal);
}

.d6-icon {
    opacity: 0.4;
    color: var(--color-text-secondary);
}

.dice-active {
    opacity: 1;
    color: var(--color-text-primary);
}

.dice-added {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-success-sm);
}

.dice-subtracted {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger-sm);
}

.dice-hover-preview {
    opacity: 1;
    color: var(--color-text-primary);
}

.can-edit {
    cursor: pointer;
}
</style>
