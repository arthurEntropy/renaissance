<template>
    <div class="engagement-successes">
        <SuccessChip v-for="success in successData" :key="success.id" :success="success"
            :removable="isEditMode && success.isUserAdded" @remove="$emit('remove-success', success.id)" />

        <div v-if="isEditMode" class="add-success-container">
            <AddButton :show="true" size="small" position="inline" title="Add success" @click="$emit('add-success')" />
        </div>

        <div v-if="successData.length === 0 && !isEditMode" class="no-successes-message">
            No engagement successes available
        </div>
    </div>

    <!-- Success Selection Dropdown -->
    <div v-if="showDropdown" class="success-dropdown"
        :style="{ top: dropdownPosition.y + 'px', left: dropdownPosition.x + 'px' }">

        <div v-if="availableSuccesses.length > 0">
            <button v-for="success in availableSuccesses" :key="success.id" class="success-option"
                @click="$emit('select-success', success.id)">
                {{ success.name }}
            </button>
        </div>

        <div v-else class="success-dropdown-empty">
            All engagement successes already owned
        </div>
    </div>
</template>

<script setup>
import SuccessChip from '@/components/ui/chips/SuccessChip.vue'
import AddButton from '@/components/ui/buttons/AddButton.vue'

// Props
defineProps({
    successData: {
        type: Array,
        default: () => []
    },
    availableSuccesses: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    showDropdown: {
        type: Boolean,
        default: false
    },
    dropdownPosition: {
        type: Object,
        default: () => ({ x: 0, y: 0 })
    }
})

// Emits
defineEmits(['remove-success', 'add-success', 'select-success'])
</script>

<style scoped>
.engagement-successes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--space-xs);
    margin-top: 10px;
    width: 100%;
}

.add-success-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-dropdown {
    position: fixed;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-gray-light);
    border-radius: var(--radius-5);
    padding: var(--space-sm);
    z-index: var(--z-dropdown);
    max-width: 250px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: var(--shadow-elevation-sm);
}

.success-option {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-xs) 8px;
    margin-bottom: 3px;
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: none;
    border-radius: var(--radius-5);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--font-size-14);
    transition: var(--transition-background);
}

.success-option:hover {
    background-color: var(--color-bg-secondary);
}

.success-dropdown-empty {
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-xs);
    text-align: center;
    font-size: var(--font-size-14);
}

.no-successes-message {
    text-align: center;
    color: var(--color-text-muted);
    margin-top: 5px;
    font-size: var(--font-size-14);
}
</style>
