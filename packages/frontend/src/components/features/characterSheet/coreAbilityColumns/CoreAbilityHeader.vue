<template>
    <div class="core-ability-header">
        <h2>{{ title }}</h2>
        <NumberInput :model-value="value" :disabled="!canEdit" @update:model-value="$emit('update', $event)" :min="0"
            :size="NUMBER_INPUT_SIZES.LARGE" />
    </div>
</template>

<script setup>
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'

defineProps({
    title: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: false
    }
})

defineEmits(['update'])
</script>

<style scoped>
.core-ability-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--space-sm);
    gap: var(--space-md);
}

h2 {
    margin: 0;
}

.number-input-container {
    top: -4px;
}
</style>
