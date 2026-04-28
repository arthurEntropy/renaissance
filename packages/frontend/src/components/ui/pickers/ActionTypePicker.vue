<template>
    <button ref="triggerRef" :id="id" type="button" :class="[selectClass, 'action-type-trigger']"
        :aria-expanded="showPicker" @click="toggleFromTrigger">
        <span class="action-type-label" :class="{ 'is-placeholder': !modelValue }">{{ displayLabel }}</span>
        <span class="action-type-chevron">▾</span>
    </button>

    <CascadeMenuFrame v-if="showPicker" :overlay="false" :anchor-position="anchorPosition" anchor-mode="anchorY"
        :close-on-outside-click="true" @close="closePicker">
        <div class="action-type-menu">
            <div class="cascade-col">
                <div class="cascade-item-wrap" v-for="actionType in actionTypes" :key="actionType.id"
                    :class="{ active: modelValue === actionType.id }" @click="selectActionType(actionType.id)">
                    <button class="cascade-btn" tabindex="-1">
                        <span class="cascade-btn-label">{{ actionType.name }}</span>
                    </button>
                </div>
            </div>
        </div>
    </CascadeMenuFrame>
</template>

<script setup>
import { computed } from 'vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { useActionTypesStore } from '@/stores/actionTypesStore'
import { useAnchoredPickerTrigger } from '@/composables/useAnchoredPickerTrigger'

const props = defineProps({
    id: {
        type: String,
        default: 'actionType',
    },
    modelValue: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '-- Select Type --',
    },
    selectClass: {
        type: String,
        default: 'modal-input',
    },
})

const emit = defineEmits(['update:modelValue'])

const actionTypesStore = useActionTypesStore()
const actionTypes = computed(() => actionTypesStore.items)

const {
    triggerRef,
    anchorPosition,
    showPicker,
    toggleFromTrigger,
    closePicker,
} = useAnchoredPickerTrigger()

const displayLabel = computed(() => {
    if (!props.modelValue) return props.placeholder
    return actionTypes.value.find((item) => item.id === props.modelValue)?.name || props.placeholder
})

const selectActionType = (actionTypeId) => {
    emit('update:modelValue', actionTypeId)
    closePicker()
}
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

.action-type-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-family: var(--font-family-primary) !important;
}

.action-type-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.action-type-label.is-placeholder {
    color: var(--color-text-muted);
}

.action-type-chevron {
    color: var(--color-text-muted);
    font-size: var(--font-size-11);
}

.action-type-menu {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 3px;
}

.cascade-col {
    width: 220px;
}

.cascade-item-wrap.active>.cascade-btn,
.cascade-item-wrap:hover>.cascade-btn {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}
</style>
