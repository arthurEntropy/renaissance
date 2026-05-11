<template>
    <div v-if="selectedCharacter?.mp" class="mp-container">
        <span class="mp-label">MP:</span>
        <NumberInput :model-value="selectedCharacter.mp.current" :disabled="!isEditMode"
            @update:model-value="updateCurrent" :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
        <span>/</span>
        <NumberInput :model-value="selectedCharacter.mp.base" :disabled="!isEditMode" @update:model-value="updateBase"
            :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import { useCharactersStore } from '@/stores/charactersStore'

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const updateCurrent = (value) => {
    if (!isNaN(value)) {
        selectedCharacter.value.mp.current = value
    }
}

const updateBase = (value) => {
    if (!isNaN(value)) {
        selectedCharacter.value.mp.base = value
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.mp-container {
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) var(--space-lg);
    border-radius: var(--radius-15);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.mp-label {
    font-size: var(--font-size-14);
    margin-right: 5px;
    font-style: italic;
}

/* Responsive styles */
@media (max-width: 768px) {
    .mp-container {
        margin-top: 5px;
    }
}
</style>
