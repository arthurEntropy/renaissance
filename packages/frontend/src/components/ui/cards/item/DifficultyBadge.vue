<template>
    <div class="difficulty-badge edit-trigger" :class="{ 'difficulty-badge--set': value != null }"
        :title="value != null ? `Difficulty: ${value}` : 'Set difficulty'" @click.stop="startEdit">
        <div class="difficulty-badge-content">
            <input v-if="editing" :ref="el => { if (el) el.focus() }" v-model="editValue" type="number"
                class="difficulty-badge-input" @keydown.enter="commitEdit" @keydown.escape="cancelEdit"
                @blur="commitEdit" @click.stop />
            <span v-else class="difficulty-badge-text">
                {{ value != null ? value : '' }}
            </span>
        </div>
        <FloatingActionButton v-if="value != null && !editing" :type="FAB_TYPES.REFRESH" :size="FAB_SIZES.SMALL"
            :visibility="FAB_VISIBILITIES.ON_HOVER" class="difficulty-badge-clear" title="Clear difficulty"
            @click.stop="$emit('update:value', null)" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    value: {
        type: Number,
        default: null,
    },
})

const emit = defineEmits(['update:value'])

const editing = ref(false)
const editValue = ref('')

function startEdit() {
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
    cursor: pointer;
    z-index: var(--z-interactive);
    transition: border-color var(--transition-fast);
    pointer-events: auto;
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
