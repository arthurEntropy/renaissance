<template>
    <div class="core-ability-header">
        <h2>{{ title }}</h2>
        <NumberInput :model-value="value" @update:model-value="$emit('update', $event)" :min="0" size="large" />
    </div>
</template>

<script setup>
import NumberInput from '@/components/NumberInput.vue'

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
    gap: 10px;
}

h2 {
    margin: 0;
    font-size: 1.2rem;
}
</style>
