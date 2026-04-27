<template>
    <div class="filter-controls">
        <input type="text" v-model="searchQuery" class="search-input" :placeholder="searchPlaceholder"
            aria-label="Search items" />

        <select v-if="primaryFilterOptions && primaryFilterOptions.length > 0" v-model="primaryFilter"
            class="primary-filter" aria-label="Filter by category">
            <option value="">{{ primaryFilterLabel }}</option>
            <option v-for="option in primaryFilterOptions" :key="option.id" :value="option.id">
                {{ option.name }}
            </option>
        </select>

        <SortingPicker v-if="sortOptions && Object.keys(sortOptions).length > 0" v-model="sortOption"
            :options="sortOptions" placeholder="Sort by..." />

        <slot name="additional-filters"></slot>

        <ActionButton v-if="showAddButton" variant="primary" size="large" text="+ Add" @click="$emit('create')" />
    </div>
</template>

<script setup>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'

defineProps({
    searchPlaceholder: {
        type: String,
        default: 'Search...'
    },

    primaryFilterOptions: {
        type: Array,
        default: () => [],
    },
    primaryFilterLabel: {
        type: String,
        default: 'All Items'
    },

    sortOptions: {
        type: Object,
        default: () => ({})
    },

    showAddButton: {
        type: Boolean,
        default: false
    }
})

defineEmits(['create'])

const searchQuery = defineModel('searchQuery')
const primaryFilter = defineModel('primaryFilter')
const sortOption = defineModel('sortOption')
</script>

<style scoped>
.filter-controls {
    display: flex;
    position: relative;
    gap: var(--space-lg);
    width: 100%;
    max-width: 85%;
    margin: 0 auto var(--space-lg) auto;
    padding: 0 var(--space-xl);
    z-index: var(--z-overlay);
    justify-content: center;
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
:deep(.source-filter),
:deep(.category-filter) {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background-color: var(--overlay-black-medium);
    font-size: var(--font-size-16);
    color: var(--color-white);
}

:deep(.category-filter) {
    min-width: 120px;
}

.primary-filter optgroup,
.sort-filter optgroup,
:deep(.source-filter) optgroup,
:deep(.category-filter) optgroup {
    background-color: var(--color-black);
}

.primary-filter option,
.sort-filter option,
:deep(.source-filter) option,
:deep(.category-filter) option {
    background-color: var(--overlay-black-heavy);
    padding: var(--space-sm);
}

.search-input::placeholder {
    color: var(--color-gray-light);
}

.search-input:focus,
.primary-filter:focus,
.sort-filter:focus,
:deep(.source-filter):focus,
:deep(.category-filter):focus {
    outline: none;
    border-color: var(--color-gray-light);
    box-shadow: var(--shadow-glow-sm);
}

:deep(.source-filter):disabled,
:deep(.category-filter):disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--overlay-black-heavy);
}
</style>
