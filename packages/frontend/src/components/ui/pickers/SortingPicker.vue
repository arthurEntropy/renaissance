<template>
    <div class="sorting-row">
        <label v-if="label" class="sorting-label">{{ label }}</label>
        <button ref="triggerRef" type="button" class="sort-select" :aria-expanded="showPicker"
            @click="toggleFromTrigger">
            <span class="sort-select-value">{{ selectedLabel }}</span>
            <span class="dropdown-icon">
                <ChevronDownIcon />
            </span>
        </button>

        <CascadeMenuFrame v-if="showPicker" :overlay="false" :anchor-position="anchorPosition" anchor-mode="anchorY"
            :close-on-outside-click="true" @close="closePicker">
            <div class="sorting-menu">
                <div class="sorting-menu-col">
                    <button v-if="placeholder" type="button" class="sorting-option"
                        :class="{ active: modelValue === '' }" @click="selectOption('')">
                        {{ placeholder }}
                    </button>

                    <template v-if="isGrouped">
                        <div v-for="(groupOptions, group) in options" :key="group" class="sorting-group">
                            <div class="sorting-group-label">{{ group }}</div>
                            <button v-for="option in groupOptions" :key="option.value" type="button"
                                class="sorting-option" :class="{ active: modelValue === option.value }"
                                @click="selectOption(option.value)">
                                {{ option.label }}
                            </button>
                        </div>
                    </template>

                    <template v-else>
                        <button v-for="option in options" :key="option.value" type="button" class="sorting-option"
                            :class="{ active: modelValue === option.value }" @click="selectOption(option.value)">
                            {{ option.label }}
                        </button>
                    </template>
                </div>
            </div>
        </CascadeMenuFrame>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { useAnchoredPickerTrigger } from '@/composables/useAnchoredPickerTrigger'

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

const emit = defineEmits(['update:modelValue'])

const isGrouped = computed(() => !Array.isArray(props.options))

const {
    triggerRef,
    anchorPosition,
    showPicker,
    toggleFromTrigger,
    closePicker,
} = useAnchoredPickerTrigger()

const flatOptions = computed(() => {
    if (!props.options) return []

    if (Array.isArray(props.options)) {
        return props.options
    }

    const entries = []
    for (const groupOptions of Object.values(props.options)) {
        for (const option of groupOptions || []) {
            entries.push(option)
        }
    }
    return entries
})

const selectedLabel = computed(() => {
    if (!props.modelValue) return props.placeholder || 'Select...'
    return flatOptions.value.find((option) => option.value === props.modelValue)?.label || (props.placeholder || 'Select...')
})

const selectOption = (value) => {
    emit('update:modelValue', value)
    closePicker()
}
</script>

<style scoped>
.sorting-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.sorting-label {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
}

.sort-select {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    min-width: 140px;
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-13);
    cursor: pointer;
    transition: var(--transition-normal);
}

.sort-select-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sort-select:hover {
    border-color: var(--color-border-primary);
}

.sort-select:focus {
    outline: none;
    border-color: var(--color-primary);
}

.dropdown-icon {
    margin-left: var(--space-sm);
    pointer-events: none;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    width: 16px;
    height: 16px;
}

.sorting-menu {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 3px;
}

.sorting-menu-col {
    width: 220px;
    max-height: min(360px, calc(100vh - 40px));
    overflow-y: auto;
    font-family: var(--font-family-primary);
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-xs) 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.sorting-group+.sorting-group {
    margin-top: 2px;
    border-top: 1px solid var(--overlay-white-medium);
    padding-top: var(--space-xs);
}

.sorting-group-label {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px var(--space-sm) 4px;
}

.sorting-option {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: var(--font-size-12);
    padding: 6px var(--space-sm);
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
}

.sorting-option:hover,
.sorting-option.active {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}
</style>
