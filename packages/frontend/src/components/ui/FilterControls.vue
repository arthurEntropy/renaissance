<template>
    <div class="filter-controls">
        <!-- Search Input -->
        <input type="text" v-model="searchQuery" class="search-input" :placeholder="searchPlaceholder" />

        <!-- Primary Filter (Expansions or Sources) -->
        <select v-model="primaryFilter" :class="primaryFilterClass">
            <option value="">{{ primaryFilterLabel }}</option>

            <!-- Simple options (for expansions) -->
            <template v-if="!primaryFilterOptions.grouped">
                <option v-for="option in primaryFilterOptions.items" :key="option.id" :value="option.id">
                    {{ option.name }}
                </option>
            </template>

            <!-- Grouped options (for sources) -->
            <template v-else>
                <SourceOptionsGroup :sources="primaryFilterOptions.sources" />
            </template>
        </select>

        <!-- Sort Filter (optional) -->
        <select v-if="sortOptions && Object.keys(sortOptions).length > 0" v-model="sortOption" class="sort-filter">
            <option value="">Sort by...</option>
            <optgroup v-for="(options, group) in sortOptions" :key="group" :label="group">
                <option v-for="option in options" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </optgroup>
        </select>

        <!-- Additional Filters Slot -->
        <slot name="additional-filters"></slot>

        <!-- Add Button (optional) -->
        <ActionButton v-if="showAddButton" variant="primary" size="large" :text="addButtonText"
            @click="$emit('create')" />
    </div>
</template>

<script setup>
import { defineModel } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SourceOptionsGroup from '@/components/ui/forms/SourceOptionsGroup.vue'

defineProps({
    // Search
    searchPlaceholder: {
        type: String,
        default: 'Search...'
    },

    // Primary filter (expansions or sources)
    primaryFilterOptions: {
        type: Object,
        required: true,
        // Expected format:
        // For simple list: { grouped: false, items: [{ id, name }] }
        // For grouped: { grouped: true, groups: { "Group Name": [{ id, name }] } }
    },
    primaryFilterLabel: {
        type: String,
        default: 'All Items'
    },
    primaryFilterClass: {
        type: String,
        default: 'primary-filter'
    },

    // Sort options
    sortOptions: {
        type: Object,
        default: () => ({})
    },

    // Add button
    showAddButton: {
        type: Boolean,
        default: false
    },
    addButtonText: {
        type: String,
        default: '+ Add'
    }
})

defineEmits(['create'])

// Two-way binding with parent
const searchQuery = defineModel('searchQuery')
const primaryFilter = defineModel('primaryFilter')
const sortOption = defineModel('sortOption')
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.filter-controls {
    display: flex;
    gap: var(--space-lg);
    width: 100%;
    max-width: 60%;
    margin-bottom: var(--space-lg);
    padding: 0 var(--space-xl);
    z-index: var(--z-overlay);
}

.search-input {
    flex: 2;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background-color: var(--overlay-black-medium);
    font-size: var(--font-size-16);
}

.primary-filter,
.sort-filter {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background-color: var(--overlay-black-medium);
    font-size: var(--font-size-16);
    color: var(--color-white);
}

.primary-filter optgroup,
.sort-filter optgroup {
    background-color: var(--color-black);
}

.primary-filter option,
.sort-filter option {
    background-color: var(--overlay-black-heavy);
    padding: var(--space-sm);
}

.search-input::placeholder {
    color: var(--color-gray-light);
}

.search-input:focus,
.primary-filter:focus,
.sort-filter:focus {
    outline: none;
    border-color: var(--color-gray-light);
    box-shadow: var(--shadow-glow-sm);
}
</style>
