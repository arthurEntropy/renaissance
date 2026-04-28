<template>
    <div v-if="selectedCount > 0" class="edit-multiple-bar">
        <span class="selected-count">{{ selectedCount }} item{{ selectedCount !== 1 ? 's' : '' }} selected</span>
        <ActionButton variant="primary" size="large" text="Edit Multiple" @click="$emit('edit')" />
        <button type="button" class="close-button" @click="$emit('clear')" aria-label="Clear selection">
            <XMarkIcon class="icon-sm" />
        </button>
    </div>
</template>

<script setup>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
    selectedCount: {
        type: Number,
        required: true
    }
})

defineEmits(['edit', 'clear'])
</script>

<style scoped>
.edit-multiple-bar {
    position: fixed;
    bottom: var(--space-xl);
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-10);
    padding: var(--space-md) var(--space-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    z-index: 100;
}

.selected-count {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-medium);
}

.close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs);
    background: transparent;
    border: none;
    border-radius: var(--radius-5);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: var(--transition-normal);
}

.close-button:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.icon-sm {
    width: 20px;
    height: 20px;
}
</style>
