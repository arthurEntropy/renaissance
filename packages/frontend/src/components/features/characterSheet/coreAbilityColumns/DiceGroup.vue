<template>
    <div class="dice-group">
        <i v-for="(n, diceIndex) in MAX_SKILL_RANKS" :key="diceIndex" :class="getDiceClasses(diceIndex)"
            @click="isEditMode ? $emit('dice-click', diceIndex) : null" class="dice-icon d6-icon"
            :style="{ cursor: isEditMode ? 'pointer' : 'default' }">
        </i>
    </div>
</template>

<script setup>
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants'
import { DIE_TYPE } from '@shared/constants/dice'

// Props
const props = defineProps({
    skill: {
        type: Object,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

// Emits
defineEmits(['dice-click'])

// Methods
const getDiceClasses = (diceIndex) => {
    // Check if rank is active (from base ranks or positive dice mod)
    const withinRanks = diceIndex < props.skill.ranks
    const withinDiceMod =
        diceIndex >= props.skill.ranks &&
        diceIndex < props.skill.ranks + props.skill.diceMod &&
        props.skill.diceMod > 0
    const isActive = withinRanks || withinDiceMod

    // Check if die is added by positive dice mod
    const isAdded = (
        diceIndex >= props.skill.ranks &&
        diceIndex < props.skill.ranks + props.skill.diceMod &&
        props.skill.diceMod > 0
    )

    // Check if die is subtracted by negative dice mod
    const isSubtracted = (
        props.skill.ranks - diceIndex <= Math.abs(props.skill.diceMod) &&
        props.skill.diceMod < 0 &&
        diceIndex < props.skill.ranks
    )

    return [
        getDiceFontClass(DIE_TYPE.D6, DIE_TYPE.D6),
        {
            'dice-active': isActive,
            'dice-added': isAdded,
            'dice-subtracted': isSubtracted,
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
    cursor: pointer;
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
</style>
