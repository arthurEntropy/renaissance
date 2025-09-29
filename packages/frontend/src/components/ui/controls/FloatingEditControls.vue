<template>
    <div class="floating-edit-controls">
        <button v-if="showDelete" @click="$emit('delete', index)" class="fab-delete" :title="deleteTitle" type="button">
            <XMarkIcon class="delete-icon" />
        </button>
        <span v-if="showDrag" class="fab-drag drag-handle" :title="dragTitle">
            ⋮⋮
        </span>
    </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
    index: {
        type: Number,
        required: true
    },
    showDelete: {
        type: Boolean,
        default: true
    },
    showDrag: {
        type: Boolean,
        default: true
    },
    deleteTitle: {
        type: String,
        default: 'Remove item'
    },
    dragTitle: {
        type: String,
        default: 'Drag to reorder'
    }
})

defineEmits(['delete'])
</script>

<style scoped>
.floating-edit-controls {
    position: absolute;
    left: -17px;
    top: -3px;
    transform: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: var(--z-dropdown);
    pointer-events: auto;
}

.fab-delete {
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    background: var(--color-black);
    color: var(--color-text-primary);
    border: 1px solid var(--color-gray-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-color);
    padding: 0;
    position: relative;
    left: 9px;
}

.fab-delete:hover {
    background: var(--color-black);
}

.delete-icon {
    width: 16px;
    height: 16px;
    color: var(--color-text-primary);
}

.fab-delete:hover .delete-icon {
    color: var(--color-danger);
}

.fab-drag {
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: move;
    user-select: none;
    transition: var(--transition-color-bg);
}

.fab-drag:hover {
    color: var(--color-white);
}
</style>
