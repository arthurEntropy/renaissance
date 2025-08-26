<template>
    <div class="mp-container">
        <span class="mp-label">MP:</span>
        <NumberInput :model-value="mp.current" @update:model-value="updateCurrent" :min="0" size="small" />
        <span>/</span>
        <NumberInput :model-value="mp.max" @update:model-value="updateMax" :min="0" size="small" />
    </div>
</template>

<script setup>
import NumberInput from '@/components/ui/forms/NumberInput.vue'

const props = defineProps({
    mp: {
        type: Object,
        required: true,
        validator: (value) => {
            return value && typeof value.current === 'number' && typeof value.max === 'number'
        }
    }
})

const emit = defineEmits(['update:mp'])

const updateCurrent = (value) => {
    if (!isNaN(value)) {
        emit('update:mp', {
            ...props.mp,
            current: value,
        })
    }
}

const updateMax = (value) => {
    if (!isNaN(value)) {
        emit('update:mp', {
            ...props.mp,
            max: value,
        })
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.mp-container {
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) 15px;
    border-radius: var(--radius-5);
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
