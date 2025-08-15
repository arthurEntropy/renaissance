<template>
    <div class="skill-row">
        <span class="skill-name-clickable" @click="$emit('open-skill-check', skill.name)">
            {{ skill.name }}
        </span>
        <i class="dice-icon d12-icon"
            :class="[getDiceFontClass(DICE_SIZES.D12, DICE_SIZES.D12), getStyleClassForFavoredStatus(skill)]">
        </i>
        <DiceGroup :skill="skill" :is-rank-active="isRankActive" :is-dice-added="isDiceAdded"
            :is-dice-subtracted="isDiceSubtracted" @dice-click="$emit('dice-click', skill.name, $event)" />
    </div>
</template>

<script setup>
import { getDiceFontClass } from '@shared/utils/diceFontUtils'
import { DICE_SIZES } from '@/constants/coreAbilityConfig'
import DiceGroup from './DiceGroup.vue'

// Props
defineProps({
    skill: {
        type: Object,
        required: true
    },
    isRankActive: {
        type: Function,
        required: true
    },
    isDiceAdded: {
        type: Function,
        required: true
    },
    isDiceSubtracted: {
        type: Function,
        required: true
    },
    getStyleClassForFavoredStatus: {
        type: Function,
        required: true
    }
})

// Emits
defineEmits(['open-skill-check', 'dice-click'])
</script>

<style scoped>
.skill-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: var(--space-xs) 0;
    height: 25px;
    border-bottom: 1px solid var(--color-gray-dark);
}

.skill-name-clickable {
    color: var(--color-accent-gold);
    text-align: left;
    flex: 1;
    max-width: 85px;
    cursor: pointer;
    transition: var(--transition-color) ease-in-out;
}

.skill-name-clickable:hover {
    color: var(--color-white);
    text-shadow: var(--shadow-glow-sm-gold);
}

.dice-icon {
    font-size: var(--font-size-24);
    cursor: pointer;
    transition: var(--transition-color), opacity var(--transition-normal);
}

.d12-icon {
    margin-left: auto;
    margin-right: 8px;
    width: 25px;
    text-align: center;
    border-radius: var(--radius-5);
}

/* Conditional styles */
.favored {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-sm-success);
}

.ill-favored {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-sm-danger);
}
</style>
