<template>
    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :class="selectClass">
        <option value="">{{ placeholder }}</option>
        <SourceOptionsGroup :sources="sources" />
    </select>
</template>

<script setup>
import { computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import SourceOptionsGroup from './SourceOptionsGroup.vue'

const props = defineProps({
    id: {
        type: String,
        default: 'source'
    },
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: '-- Select Source --'
    },
    variant: {
        type: String,
        default: 'modal', // 'modal' or 'filter'
        validator: (value) => ['modal', 'filter'].includes(value)
    }
})

defineEmits(['update:modelValue'])

const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources

const selectClass = computed(() => {
    return props.variant === 'modal' ? 'modal-input' : 'filter-select'
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.filter-select {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background-color: var(--overlay-black-medium);
    font-size: var(--font-size-16);
    color: var(--color-white);
}

.filter-select optgroup {
    background-color: var(--color-black);
}

.filter-select option {
    background-color: var(--overlay-black-heavy);
    padding: var(--space-sm);
}

.filter-select:focus {
    outline: none;
    border-color: var(--color-gray-light);
    box-shadow: var(--shadow-glow-sm);
}

/* Assume modal-input styles are defined globally */
</style>
