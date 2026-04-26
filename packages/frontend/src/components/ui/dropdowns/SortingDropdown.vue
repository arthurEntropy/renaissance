<template>
    <div class="sorting-row">
        <label v-if="label" class="sorting-label">{{ label }}</label>
        <div class="sorting-dropdown">
            <select :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" class="sort-select">
                <option v-if="placeholder" value="">{{ placeholder }}</option>

                <template v-if="isGrouped">
                    <optgroup v-for="(groupOptions, group) in options" :key="group" :label="group">
                        <option v-for="option in groupOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </option>
                    </optgroup>
                </template>

                <template v-else>
                    <option v-for="option in options" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </template>
            </select>
            <div class="dropdown-icon">
                <ChevronDownIcon />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    options: {
        type: [Object, Array],
        default: () => ({})
    },
    label: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: ''
    }
})

defineEmits(['update:modelValue'])

const isGrouped = computed(() => !Array.isArray(props.options))
</script>

<style scoped>
.sorting-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
}

.sorting-label {
    font-family: var(--font-family-body);
    font-size: var(--font-size-13, 13px);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
}

.sorting-dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.sort-select {
    /* Matching ArtPage control-select styles */
    min-width: 140px;
    padding: var(--space-xs, 4px) var(--space-sm, 8px) var(--space-xs, 4px) var(--space-sm, 8px);
    padding-right: 32px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5, 5px);
    color: var(--color-text-primary);
    font-family: 'Lora', serif;
    font-size: var(--font-size-13, 13px);
    cursor: pointer;
    transition: var(--transition-normal, all 0.2s ease);
    appearance: none;
}

.sort-select:hover {
    border-color: var(--color-border-primary);
}

.sort-select:focus {
    outline: none;
    border-color: var(--color-primary);
}

.dropdown-icon {
    position: absolute;
    right: 10px;
    pointer-events: none;
    color: var(--color-text-secondary, #999);
    display: flex;
    align-items: center;
    width: 16px;
    height: 16px;
}
</style>