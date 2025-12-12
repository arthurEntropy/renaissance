<template>
    <div class="skill-row">
        <span :class="['skill-name', { 'skill-name-clickable': isEditMode, 'skill-name-disabled': !isEditMode }]"
            @click="isEditMode && $emit('open-skill-check', props.skill.name)">
            {{ props.skill.name }}
        </span>
        <i class="dice-icon d12-icon"
            :class="[getDiceFontClass(DIE_TYPE.D12, DIE_TYPE.D12), getStyleClassForFavoredStatus(props.skill)]">
        </i>
        <DiceGroup :skill="props.skill" :is-edit-mode="isEditMode"
            @dice-click="$emit('dice-click', props.skill.name, $event)" />
    </div>
</template>

<script setup>
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { DIE_TYPE } from '@shared/constants/dice'
import BaseRollService from '@/services/rolls/baseRollService'
import DiceGroup from './DiceGroup.vue'

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

// Get favored status CSS class
const getStyleClassForFavoredStatus = (skill) => {
    const status = BaseRollService.getFavoredStatus(skill)
    return status || ''
}

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

.skill-name {
    text-align: left;
    flex: 1;
    max-width: 85px;
    transition: var(--transition-color) ease-in-out;
}

.skill-name-clickable {
    color: var(--color-primary);
    cursor: pointer;
}

.skill-name-clickable:hover {
    color: var(--color-text-primary);
    text-shadow: var(--shadow-glow-gold-sm);
}

.skill-name-disabled {
    color: var(--color-primary);
    cursor: default;
}

.dice-icon {
    font-size: var(--font-size-24);
    transition: var(--transition-color), opacity var(--transition-normal);
}

.d12-icon {
    margin-left: auto;
    margin-right: var(--space-xs);
    width: 25px;
    text-align: center;
    border-radius: var(--radius-5);
}

/* Conditional styles */
.favored {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-success-sm);
}

.ill-favored {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger-sm);
}
</style>
