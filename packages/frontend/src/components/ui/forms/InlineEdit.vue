<template>
    <div class="inline-edit-field" :class="{ editing: isEditing }" @click.stop="!isEditing && $emit('start-edit')">
        <template v-if="isEditing">
            <input v-if="type === 'text'" :type="inputType" v-model="localValue" :class="inputClass"
                :placeholder="placeholder" @blur="handleSave" @keyup.enter="handleSave" @keyup.escape="handleCancel"
                ref="inputRef" />
            <textarea v-else-if="type === 'textarea'" v-model="localValue" :class="inputClass"
                :placeholder="placeholder" @blur="handleSave" @keyup.escape="handleCancel" ref="inputRef" />
        </template>
        <template v-else>
            <span v-if="modelValue" :class="valueClass">{{ modelValue }}</span>
            <span v-else :class="emptyClass">{{ emptyText }}</span>
        </template>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

// Props
const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    isEditing: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: 'text',
        validator: (value) => ['text', 'textarea'].includes(value),
    },
    inputType: {
        type: String,
        default: 'text',
    },
    placeholder: {
        type: String,
        default: '',
    },
    emptyText: {
        type: String,
        default: 'Click to add...',
    },
    inputClass: {
        type: String,
        default: 'form-input inline-edit',
    },
    valueClass: {
        type: String,
        default: '',
    },
    emptyClass: {
        type: String,
        default: 'empty-field',
    },
})

// Emits
const emit = defineEmits(['update:modelValue', 'start-edit', 'save', 'cancel'])

// Local state
const localValue = ref(props.modelValue)
const inputRef = ref(null)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
    localValue.value = newValue
})

// Watch for editing state changes
watch(() => props.isEditing, async (isEditing) => {
    if (isEditing) {
        localValue.value = props.modelValue
        await nextTick()
        inputRef.value?.focus()
    }
})

// Methods
const handleSave = () => {
    emit('update:modelValue', localValue.value)
    emit('save', localValue.value)
}

const handleCancel = () => {
    localValue.value = props.modelValue
    emit('cancel')
}

// Expose ref for parent access
defineExpose({
    inputRef,
})
</script>

<style scoped>
.inline-edit-field {
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-5);
    transition: var(--transition-background);
}

.inline-edit-field:hover:not(.editing) {
    background-color: var(--overlay-white-subtle);
}

.inline-edit-field.editing {
    background-color: var(--overlay-white-subtle);
    cursor: default;
}

.form-input.inline-edit {
    background-color: var(--color-gray-dark);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    color: var(--color-white);
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-16);
    width: 100%;
    outline: none;
    box-sizing: border-box;
}

.form-input.inline-edit:focus {
    border-color: var(--color-gray-light);
}

.empty-field {
    color: var(--color-gray-medium);
    font-style: italic;
    font-size: var(--font-size-14);
}
</style>
