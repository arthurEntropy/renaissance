<template>
    <select :value="modelValue" class="category-filter" aria-label="Filter by magical type"
        @change="$emit('update:modelValue', $event.target.value)">
        <option value="">All Abilities</option>
        <option value="magical">Magical Only</option>
        <option value="mundane">Mundane Only</option>
    </select>
</template>

<script setup>
defineProps({
    modelValue: {
        type: String,
        default: '',
    },
})

defineEmits(['update:modelValue'])
</script>
