<template>
    <div class="core-ability-header">
        <h2>{{ title }}</h2>
        <NumberInput :model-value="value" @update:model-value="$emit('update', $event)" :min="0" size="large" />
    </div>
</template>

<script setup>
import NumberInput from '@/components/ui/forms/NumberInput.vue'

// Props
defineProps({
    title: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
})

// Emits
defineEmits(['update'])
</script>

<style scoped>
.core-ability-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    height: 28px;
    gap: var(--space-md);
}

h2 {
    margin: 0;
    font-size: var(--font-size-20);
}
</style>
