<template>
    <div ref="filterBarRef" class="filter-bar">
        <div class="filter-row">
            <!-- Type Toggle Buttons (optional) -->
            <div v-if="typeToggles.length > 0" class="type-toggle">
                <button v-for="toggle in typeToggles" :key="toggle.value" type="button" class="type-button"
                    :class="[toggle.colorClass, { selected: localSelectedTypes.includes(toggle.value) }]"
                    @click="toggleType(toggle.value)">
                    <component :is="toggle.icon" v-if="toggle.icon" class="icon-sm" />
                    <span>{{ toggle.label }}</span>
                </button>
            </div>

            <!-- Text Search Input -->
            <div v-if="showSearch" class="search-input-wrapper">
                <input v-model="localSearchQuery" class="filter-input search-input" :placeholder="searchPlaceholder"
                    type="text" aria-label="Search" />
                <FloatingActionButton v-if="localSearchQuery" :variant="FAB_TYPES.DELETE"
                    :visibility="FAB_VISIBILITIES.ALWAYS" class="search-clear-fab" @click="localSearchQuery = ''" />
            </div>

            <!-- Tag Picker + Selected Chips -->
            <FilterTagPicker v-if="tagGroups.length > 0" v-model:selectedTags="localSelectedTags"
                :tag-groups="tagGroups" :tag-picker-mode="tagPickerMode" :tag-search-placeholder="tagSearchPlaceholder"
                :multiselect="multiselect" />

            <!-- Additional Filters Slot -->
            <slot name="additional-filters" />

            <!-- Grid Size Toggle -->
            <div v-if="showSizeToggle" class="size-toggle">
                <button type="button" class="size-button" :class="{ selected: localGridSize === 'large' }"
                    @click="localGridSize = 'large'">
                    Large
                </button>
                <button type="button" class="size-button" :class="{ selected: localGridSize === 'small' }"
                    @click="localGridSize = 'small'">
                    Small
                </button>
            </div>
        </div>

        <!-- Controls Row: stats + sort/group pickers + actions -->
        <div v-if="showControlsRow" class="controls-row">
            <div v-if="stats.length > 0" class="stats-items">
                <span v-for="stat in stats" :key="stat.label" class="stat-item">
                    {{ stat.label }}: <span class="stat-value">{{ stat.value }}</span>
                </span>
            </div>

            <div class="controls-right" :class="{ 'controls-right--full': stats.length === 0 }">
                <SortingPicker v-if="hasGroupOptions" v-model="localGroupBy" :options="groupOptions"
                    placeholder="Group by..." />
                <SortingPicker v-if="hasOrderOptions" v-model="localOrderBy" :options="orderOptions"
                    placeholder="Order by..." />
                <slot name="actions" />
                <ActionButton v-if="showAddButton" variant="primary" size="small" :text="addButtonLabel"
                    @click="$emit('add')" />
            </div>
        </div>
    </div>

    <button type="button" class="to-top-button" :class="{ 'to-top-button--visible': showToTopButton }"
        :aria-hidden="!showToTopButton" @click="scrollToTop">
        <ChevronUpIcon class="to-top-button__icon" />
        <span>To Top</span>
    </button>
</template>

<script setup>
import { ref, computed, useSlots } from 'vue'
import { ChevronUpIcon } from '@heroicons/vue/24/outline'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FilterTagPicker from '@/components/ui/pickers/FilterTagPicker.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useScrollToTop } from '@/composables/useScrollToTop'
import { FAB_TYPES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    // Tag groups: [{ label: String, items: [{ id, name }] }]
    tagGroups: {
        type: Array,
        default: () => [],
    },
    tagPickerMode: {
        type: String,
        default: 'flat', // 'flat' | 'cascade'
    },
    // 'multi': add tags to selection; 'single': replace selection on pick
    multiselect: {
        type: Boolean,
        default: true,
    },
    tagSearchPlaceholder: {
        type: String,
        default: 'Filter by tags...',
    },

    // Type toggle buttons: [{ value, label, icon?, colorClass? }]
    typeToggles: {
        type: Array,
        default: () => [],
    },

    // Text search input (for item search, separate from tag picker)
    showSearch: {
        type: Boolean,
        default: true,
    },
    searchPlaceholder: {
        type: String,
        default: 'Search...',
    },

    // Grid size toggle
    showSizeToggle: {
        type: Boolean,
        default: false,
    },

    // Sort/Group pickers (Array or grouped Object, same as SortingPicker)
    groupOptions: {
        type: [Array, Object],
        default: () => [],
    },
    orderOptions: {
        type: [Array, Object],
        default: () => [],
    },

    // Stats items: [{ label: String, value: Number }]
    stats: {
        type: Array,
        default: () => [],
    },

    // Add button
    showAddButton: {
        type: Boolean,
        default: false,
    },
    addButtonLabel: {
        type: String,
        default: '+ Add',
    },
})

defineEmits(['add'])

// Models
const localSelectedTags = defineModel('selectedTags', { default: () => [] })
const localSelectedTypes = defineModel('selectedTypes', { default: () => [] })
const localGridSize = defineModel('gridSize', { default: 'large' })
const localGroupBy = defineModel('groupBy', { default: '' })
const localOrderBy = defineModel('orderBy', { default: '' })
const localSearchQuery = defineModel('searchQuery', { default: '' })

const slots = useSlots()

const filterBarRef = ref(null)

const { showToTopButton, scrollToTop } = useScrollToTop(filterBarRef)

const toggleType = (value) => {
    const current = localSelectedTypes.value
    if (current.includes(value)) {
        localSelectedTypes.value = current.filter((v) => v !== value)
    } else {
        localSelectedTypes.value = [...current, value]
    }
}

const hasGroupOptions = computed(() => {
    if (!props.groupOptions) return false
    return Array.isArray(props.groupOptions)
        ? props.groupOptions.length > 0
        : Object.keys(props.groupOptions).length > 0
})

const hasOrderOptions = computed(() => {
    if (!props.orderOptions) return false
    return Array.isArray(props.orderOptions)
        ? props.orderOptions.length > 0
        : Object.keys(props.orderOptions).length > 0
})

const showControlsRow = computed(() =>
    props.stats.length > 0 ||
    hasGroupOptions.value ||
    hasOrderOptions.value ||
    props.showAddButton ||
    !!slots.actions,
)
</script>

<style scoped>
.filter-bar {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    gap: var(--space-md);
    padding: var(--space-lg);
    background: var(--overlay-black-heavy);
    border-radius: var(--radius-10);
    overflow: visible;
}

.filter-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
    position: relative;
}

.type-toggle {
    display: flex;
    gap: var(--space-sm);
}

.type-button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-5);
    border: 2px solid transparent;
    cursor: pointer;
    transition: var(--transition-normal);
    opacity: 0.5;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
}

.type-button.faces {
    background: var(--color-type-faces-bg);
    color: var(--color-type-faces);
}

.type-button.places {
    background: var(--color-type-places-bg);
    color: var(--color-type-places);
}

.type-button.maps {
    background: var(--color-type-maps-bg);
    color: var(--color-type-maps);
}

.type-button.selected {
    opacity: 1;
    border-color: currentColor;
}

.type-button:hover {
    opacity: 0.8;
}

.type-button.selected:hover {
    opacity: 1;
}

.type-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.filter-input {
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
}

.filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.search-input-wrapper {
    position: relative;
    min-width: 180px;
    flex: 1;
    max-width: 280px;
    display: flex;
    align-items: center;
}

.search-input {
    width: 100%;
    box-sizing: border-box;
    padding-right: calc(var(--btn-min-height-sm) + var(--space-md));
}

.search-clear-fab {
    position: absolute;
    right: var(--space-xs);
    flex-shrink: 0;
}

.size-toggle {
    display: flex;
    gap: var(--space-xs);
    background: var(--color-bg-primary);
    padding: var(--space-xs);
    border-radius: var(--radius-5);
    margin-left: auto;
}

.size-button {
    padding: var(--space-sm) var(--space-lg);
    background: transparent;
    border: none;
    border-radius: var(--radius-5);
    color: var(--color-text-secondary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: var(--transition-normal);
}

.size-button:hover,
.size-button.selected {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.size-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.controls-row {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border-secondary);
    flex-wrap: wrap;
}

.stats-items {
    display: flex;
    gap: var(--space-lg);
    flex: 1;
}

.stat-item {
    color: var(--color-text-secondary);
}

.stat-value {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
}

.controls-right {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    flex-wrap: wrap;
    flex-shrink: 0;
}

.controls-right--full {
    margin-left: auto;
    z-index: var(--z-interactive);
}

.icon-sm {
    width: 16px;
    height: 16px;
}

.to-top-button {
    position: fixed;
    top: calc(var(--content-padding-desktop) + var(--space-sm));
    left: 50%;
    transform: translateX(-50%) translateY(calc(-1 * var(--space-sm)));
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-full);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    font-family: var(--font-family-primary);
    box-shadow: var(--glow-sm);
    cursor: pointer;
    z-index: var(--z-tooltip);
    opacity: 0;
    pointer-events: none;
    transition: var(--transition-opacity), transform var(--transition-normal), background-color var(--transition-normal);
}

.to-top-button--visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
}

.to-top-button:hover {
    background: var(--overlay-black-medium);
}

.to-top-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.to-top-button__icon {
    width: 14px;
    height: 14px;
}
</style>
