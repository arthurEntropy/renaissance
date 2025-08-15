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
    background: transparent;
    border: none;
    border-radius: 0;
    width: auto;
    height: auto;
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    transition: transform 0.2s ease;
    padding: 4px;
}

.settings-button:hover {
    background: transparent;
    box-shadow: none;
    transform: scale(1.1);
}
</style>
