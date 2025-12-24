<template>
    <div class="skill-row">
        <span :class="['skill-name', { 'skill-name-clickable': canEdit }]" @click="handleSkillClick">
            {{ skill.name }}
        </span>
        <i class="dice-icon d12-icon"
            :class="[getDiceFontClass(DIE_TYPE.D12, DIE_TYPE.D12), getStyleClassForFavoredStatus(skill)]">
        </i>
        <DiceGroup :skill="skill" :can-edit="canEdit" @update-ranks="emit('update-ranks', skill.name, $event)" />
    </div>
</template>

<script setup>
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { DIE_TYPE } from '@shared/constants/dice'
import BaseRollService from '@/services/rolls/baseRollService'
import DiceGroup from './DiceGroup.vue'

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

const emit = defineEmits(['open-skill-check', 'update-ranks'])

const getStyleClassForFavoredStatus = (skill) => {
    const status = BaseRollService.getFavoredStatus(skill)
    return status || ''
}

const handleSkillClick = () => {
    if (props.canEdit) {
        emit('open-skill-check', props.skill.name)
    }
}
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
    color: var(--color-primary);
    transition: var(--transition-color);
}

.skill-name-clickable {
    cursor: pointer;
}

.skill-name-clickable:hover {
    color: var(--color-text-primary);
    text-shadow: var(--shadow-glow-gold-sm);
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

.favored {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-success-sm);
}

.ill-favored {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger-sm);
}
</style>
