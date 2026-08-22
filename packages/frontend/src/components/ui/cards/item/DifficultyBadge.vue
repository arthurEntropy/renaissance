<template>
    <div class="difficulty-badge edit-trigger" :class="{
        'difficulty-badge--set': value != null,
        'difficulty-badge--readonly': readonly,
    }" :title="value != null ? `Difficulty: ${value}` : (readonly ? '' : 'Set difficulty')" @click.stop="startEdit">
        <div class="difficulty-badge-content">
            <input v-if="!readonly && editing" :ref="el => { if (el) el.focus() }" v-model="editValue" type="number"
                class="difficulty-badge-input" @keydown.enter="commitEdit" @keydown.escape="cancelEdit"
                @blur="commitEdit" @click.stop />
            <span v-else class="difficulty-badge-text">
                {{ value != null ? value : '' }}
            </span>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    value: {
        type: Number,
        default: null,
    },
    readonly: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update:value'])

const editing = ref(false)
const editValue = ref('')

function startEdit() {
    if (props.readonly) return

    editValue.value = props.value != null ? String(props.value) : ''
    editing.value = true
}

function commitEdit() {
    if (!editing.value) return

    const raw = editValue.value
    const parsed = raw === '' || raw === null ? null : parseInt(String(raw), 10)

    emit('update:value', parsed === null || isNaN(parsed) ? null : parsed)
    editing.value = false
}

function cancelEdit() {
    editing.value = false
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.difficulty-badge {
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 26px;
    height: 26px;
    border: 2px solid var(--color-border-primary);
    background: var(--overlay-black-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-interactive);
    transition: border-color var(--transition-fast);
    pointer-events: auto;
}

.difficulty-badge:not(.difficulty-badge--readonly) {
    cursor: pointer;
}

.difficulty-badge--readonly {
    cursor: default;
}

.difficulty-badge--set {
    border-color: var(--color-primary);
}

.difficulty-badge-content {
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
}

.difficulty-badge-text {
    font-family: var(--font-family-primary);
    font-style: italic;
    font-weight: 700;
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    line-height: 1;
    user-select: none;
}

.difficulty-badge-input {
    width: 22px;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-family-primary);
    font-style: italic;
    font-weight: 700;
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    text-align: center;
    appearance: textfield;
    -moz-appearance: textfield;
}

.difficulty-badge-input::-webkit-outer-spin-button,
.difficulty-badge-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.difficulty-badge-clear {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
}
</style>
```
