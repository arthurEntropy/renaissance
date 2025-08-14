<template>
    <div class="admin-controls">
        <!-- Settings button -->
        <button v-if="isEditMode" class="settings-button" @click="$emit('open-settings')" title="Card Style Settings">
            ⚙️
        </button>
        <!-- Edit/Save button -->
        <EditButton v-if="editable" size="large" visibility="always" :is-edit-mode="isEditMode"
            @click="$emit('toggle-edit-mode')" />
    </div>
</template>

<script setup>
import EditButton from '@/components/ui/buttons/EditButton.vue'

defineProps({
    editable: {
        type: Boolean,
        default: false
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

defineEmits(['toggle-edit-mode', 'open-settings'])
</script>

<style scoped>
.admin-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: var(--z-modal-controls);
    display: flex;
    gap: 8px;
    align-items: center;
}

.settings-button {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-8);
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-elevation-sm);
    transition: all 0.2s ease;
}

.settings-button:hover {
    background: var(--color-bg-secondary);
    box-shadow: var(--shadow-elevation-md);
}
</style>
