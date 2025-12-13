<template>
    <div class="filter-controls">
        <input type="text" v-model="searchQuery" class="search-input" :placeholder="searchPlaceholder"
            aria-label="Search items" />

        <select v-model="primaryFilter" class="primary-filter" aria-label="Filter by category">
            <option value="">{{ primaryFilterLabel }}</option>
            <option v-for="option in primaryFilterOptions" :key="option.id" :value="option.id">
                {{ option.name }}
            </option>
        </select>

        <select v-if="sortOptions && Object.keys(sortOptions).length > 0" v-model="sortOption" class="sort-filter"
            aria-label="Sort items">
            <option value="">Sort by...</option>
            <optgroup v-for="(options, group) in sortOptions" :key="group" :label="group">
                <option v-for="option in options" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </optgroup>
        </select>

        <slot name="additional-filters"></slot>

        <ActionButton v-if="showAddButton" variant="primary" size="large" text="+ Add" @click="$emit('create')" />
    </div>
</template>

<script setup>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

defineProps({
    searchPlaceholder: {
        type: String,
        default: 'Search...'
    },

    primaryFilterOptions: {
        type: Array,
        required: true,
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
