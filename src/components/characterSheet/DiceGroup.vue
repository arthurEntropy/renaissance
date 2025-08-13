<template>
    <div class="dice-group">
        <i v-for="(n, diceIndex) in DICE_COUNT" :key="diceIndex" :class="getDiceClasses(diceIndex)"
            @click="$emit('dice-click', diceIndex)" class="dice-icon d6-icon">
        </i>
    </div>
</template>

<script setup>
import { getDiceFontClass } from '../../../utils/diceFontUtils'
import { DICE_COUNT, DICE_SIZES } from '@/constants/coreAbilityConfig'

// Props
const props = defineProps({
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
    }
})

// Emits
defineEmits(['dice-click'])

// Methods
const getDiceClasses = (diceIndex) => {
    return [
        getDiceFontClass(DICE_SIZES.D6, DICE_SIZES.D6),
        {
            'dice-active': props.isRankActive(props.skill, diceIndex),
            'dice-added': props.isDiceAdded(props.skill, diceIndex),
            'dice-subtracted': props.isDiceSubtracted(props.skill, diceIndex),
        },
    ]
}
</script>

<style scoped>
.dice-group {
    display: flex;
    gap: 5px;
    margin: 0 4px;
}

.dice-icon {
    font-size: var(--font-size-24);
    cursor: pointer;
    transition: color 0.2s, opacity 0.2s;
}

.d6-icon {
    opacity: 0.4;
    color: var(--color-gray-light);
}

.dice-active {
    opacity: 1;
    color: var(--color-gray-light);
}

.dice-added {
    color: var(--color-success);
    text-shadow: 0px 0px 5px var(--color-success);
}

.dice-subtracted {
    color: var(--color-danger);
    text-shadow: 0px 0px 5px var(--color-danger);
}
</style>
