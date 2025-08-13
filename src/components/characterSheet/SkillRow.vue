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
import { getDiceFontClass } from '../../../utils/diceFontUtils'
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
    margin: 5px 0;
    height: 25px;
    border-bottom: 1px solid var(--color-gray-dark);
}

.skill-name-clickable {
    color: var(--color-accent-gold);
    text-align: left;
    flex: 1;
    max-width: 85px;
    cursor: pointer;
    transition: color 0.2s ease-in-out;
}

.skill-name-clickable:hover {
    color: var(--color-white);
    text-shadow: 0px 0px 5px var(--color-accent-gold);
}

.dice-icon {
    font-size: 24px;
    cursor: pointer;
    transition: color 0.2s, opacity 0.2s;
}

.d12-icon {
    margin-left: auto;
    margin-right: 8px;
    width: 25px;
    text-align: center;
    border-radius: 5px;
}

/* Conditional styles */
.favored {
    color: var(--color-success);
    text-shadow: 0px 0px 5px var(--color-success);
}

.ill-favored {
    color: var(--color-danger);
    text-shadow: 0px 0px 5px var(--color-danger);
}
</style>
