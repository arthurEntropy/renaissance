<template>
    <div class="floating-edit-controls">
        <button v-if="showDelete" @click="$emit('delete', index)" class="fab-delete" :title="deleteTitle" type="button">
            ⓧ
        </button>
        <span v-if="showDrag" class="fab-drag drag-handle" :title="dragTitle">
            ⋮⋮
        </span>
    </div>
</template>

<script setup>
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
    left: -18px;
    top: 2px;
    transform: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: var(--z-dropdown);
    pointer-events: auto;
}

.fab-delete {
    width: 22px;
    height: 22px;
    border-radius: var(--radius-full);
    background: var(--color-gray-dark);
    color: var(--color-danger);
    border: none;
    font-size: var(--font-size-16);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-color-bg);
    padding: 0;
}

.fab-delete:hover {
    background: var(--color-gray-medium);
    color: var(--color-white);
}

.fab-drag {
    width: 22px;
    height: 22px;
    border-radius: var(--radius-full);
    background: var(--color-gray-dark);
    color: var(--color-gray-light);
    font-size: var(--font-size-18);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: move;
    user-select: none;
    transition: var(--transition-color-bg);
}

.fab-drag:hover {
    background: var(--color-gray-medium);
    color: var(--color-white);
}
</style>
