<template>
    <div class="item-table-layout">

        <div class="filter-bar-wrapper">
            <FilterBar v-model:searchQuery="searchQueryLocal" v-model:selectedTags="selectedTagsLocal"
                v-model:groupBy="groupByLocal" v-model:viewMode="viewModeLocal" :show-view-toggle="showViewToggle"
                :order-options="sortOptions" :order-disabled="true" :tag-groups="tagGroups"
                :tag-picker-mode="tagPickerMode" :multiselect="tagMultiselect" :group-options="groupOptions"
                :show-add-button="isAdmin" search-placeholder="Search..." :tag-search-placeholder="tagSearchPlaceholder"
                :stats="stats" :hide-to-top-button="hideToTopButton" @add="emit('create')">
                <template #additional-filters>
                    <slot name="additional-filters"></slot>
                </template>
            </FilterBar>
        </div>

        <div class="table-scroll">
            <table ref="tableRef" class="item-table">
                <thead>
                    <tr>
                        <template v-for="entry in headerEntries" :key="entry.key">
                            <th v-if="entry.column" :style="columnStyle(entry.column)"
                                :class="headerClass(entry.column)" :aria-sort="ariaSort(entry.column)">
                                <button v-if="isSortable(entry.column)" type="button" class="sort-header-button"
                                    :class="{ 'sort-header-button--icon': entry.column.icon, 'is-sorted': !!sortIcon(entry.column) }"
                                    @click="toggleSort(entry.column)"
                                    @mouseenter="entry.column.icon && showHeaderTooltip(entry.column.label, $event)"
                                    @mouseleave="hideHeaderTooltip">
                                    <component :is="entry.column.icon" v-if="entry.column.icon" class="header-icon"
                                        :aria-label="entry.column.label" />
                                    <span v-else>{{ entry.column.label }}</span>
                                    <span class="sort-icon-slot">
                                        <component :is="sortIcon(entry.column)" v-if="sortIcon(entry.column)"
                                            class="sort-icon" />
                                    </span>
                                </button>
                                <span v-else>{{ entry.column.label }}</span>
                            </th>
                            <th v-else :colspan="entry.colspan" class="header-group"
                                :class="{ 'column-divider': entry.dividerBefore }">
                                <span class="header-group-label">{{ entry.label }}</span>
                            </th>
                        </template>
                    </tr>
                </thead>

                <tbody v-if="sections.length === 0">
                    <tr>
                        <td :colspan="visibleColumns.length" class="empty-cell">No items found</td>
                    </tr>
                </tbody>

                <tbody v-for="section in sections" :key="section.id ?? '__all__'">
                    <tr v-if="section.id !== null" class="group-row">
                        <td :colspan="visibleColumns.length">
                            <div class="group-header" @click="toggleGroup(section.id)">
                                <ChevronRightIcon v-if="isGroupCollapsed(section)" class="group-chevron" />
                                <ChevronDownIcon v-else class="group-chevron" />
                                <span class="group-name">
                                    {{ section.name }} <span class="group-count">({{ section.items.length }})</span>
                                </span>
                            </div>
                        </td>
                    </tr>
                    <template v-if="!isGroupCollapsed(section)">
                        <tr v-for="(item, index) in section.items" :key="item.id" class="item-row edit-hover-area"
                            :class="{ 'item-row--alt': index % 2 === 1 }">
                            <td v-for="column in visibleColumns" :key="column.key" :style="cellStyle(column, item)"
                                :class="['cell', `cell--${column.key}`, column.cellClass, { 'column-divider': column.dividerBefore, 'cell--narrow': column.narrow, 'cell--flush-left': column.flushLeft }]">
                                <slot v-if="$slots[`cell-${column.key}`]" :name="`cell-${column.key}`" :item="item"
                                    :column="column" />
                                <template v-else>{{ item[column.key] }}</template>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <slot name="modals"></slot>

        <teleport to="body">
            <div v-if="showTooltip" class="header-tooltip" :style="tooltipStyle">{{ tooltipLabel }}</div>
        </teleport>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { ChevronUpIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import FilterBar from '@/components/ui/FilterBar.vue'
import { useAuthStore } from '@/stores/authStore'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useTooltip } from '@/composables/useFloatingElement'

/**
 * @typedef {Object} TableColumn
 * @property {string} key - Unique key; the cell slot is named `cell-<key>`
 * @property {string} label - Header label (also the tooltip text for icon headers)
 * @property {Object} [icon] - Component shown in the header instead of the label
 * @property {(item: Object) => string|number|null} [sortValue] - Omit to make the column non-sortable
 * @property {string} [group] - Non-sortable header label spanning consecutive columns that share it
 * @property {boolean} [narrow] - Compact, centered column sized to its content
 * @property {boolean} [dividerBefore] - Vertical divider on the column's left edge
 * @property {string} [width] - CSS width, which also caps the column (text wraps)
 * @property {string} [cellClass]
 * @property {(item: Object) => Object} [cellStyle]
 */

const props = defineProps({
    columns: { type: Array, required: true },
    // Flat, ungrouped rows (used when `groups` is null)
    items: { type: Array, default: () => [] },
    // [{ id, name, items }]; rows are rendered as collapsible sections
    groups: { type: Array, default: null },
    groupPersistenceKey: { type: String, default: null },
    searchQuery: { type: String, default: '' },
    tagFilters: { type: Array, default: () => [] },
    tagGroups: { type: Array, default: () => [] },
    tagPickerMode: { type: String, default: 'flat' },
    tagMultiselect: { type: Boolean, default: false },
    tagSearchPlaceholder: { type: String, default: 'Filter by tags...' },
    groupBy: { type: String, default: '' },
    groupOptions: { type: [Array, Object], default: () => [] },
    // Shown (disabled) in the filter bar; column headers drive sorting in this layout
    sortOptions: { type: Object, default: () => ({}) },
    stats: { type: Array, default: () => [] },
    hideToTopButton: { type: Boolean, default: false },
    viewMode: { type: String, default: 'table' },
    showViewToggle: { type: Boolean, default: false },
})

const emit = defineEmits(['update:searchQuery', 'update:tagFilters', 'update:groupBy', 'update:viewMode', 'create', 'table-width'])

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

const { content: tooltipLabel, style: tooltipStyle, isVisible: showTooltip, show: showHeaderTooltip, hide: hideHeaderTooltip } = useTooltip({ delay: 150 })

// Reports the table's natural width so the parent can fall back to another view when it won't fit
const tableRef = ref(null)
let tableResizeObserver = null

onMounted(() => {
    tableResizeObserver = new ResizeObserver(() => emit('table-width', Math.ceil(tableRef.value.offsetWidth)))
    tableResizeObserver.observe(tableRef.value)
})

onBeforeUnmount(() => tableResizeObserver?.disconnect())


const searchQueryLocal = computed({
    get: () => props.searchQuery,
    set: (value) => emit('update:searchQuery', value),
})
const selectedTagsLocal = computed({
    get: () => props.tagFilters,
    set: (value) => emit('update:tagFilters', value),
})
const groupByLocal = computed({
    get: () => props.groupBy,
    set: (value) => emit('update:groupBy', value),
})
const viewModeLocal = computed({
    get: () => props.viewMode,
    set: (value) => emit('update:viewMode', value),
})

// Columns & headers
const visibleColumns = computed(() => props.columns)
const columnByKey = computed(() => new Map(visibleColumns.value.map((column) => [column.key, column])))

// Top header row: standalone columns plus one spanning cell per run of same-group columns
const headerEntries = computed(() => {
    const entries = []
    for (const column of visibleColumns.value) {
        const last = entries[entries.length - 1]
        if (!column.group) {
            entries.push({ key: column.key, column })
        } else if (last && last.label === column.group) {
            last.colspan += 1
        } else {
            entries.push({ key: `group-${column.group}`, label: column.group, colspan: 1, dividerBefore: column.dividerBefore })
        }
    }
    return entries
})

const columnStyle = (column) =>
    column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : null

const cellStyle = (column, item) => ({ ...columnStyle(column), ...column.cellStyle?.(item) })

const headerClass = (column) => ({
    'column-divider': column.dividerBefore,
    'header-column--narrow': column.narrow,
    'cell--flush-left': column.flushLeft,
})

// Multi-column sorting: most recently chosen column has the highest priority
const sorts = ref([])

const isSortable = (column) => typeof column.sortValue === 'function'

const toggleSort = (column) => {
    const [primary, ...rest] = sorts.value
    if (primary?.key === column.key) {
        sorts.value = [{ key: column.key, direction: primary.direction === 'asc' ? 'desc' : 'asc' }, ...rest]
    } else {
        sorts.value = [{ key: column.key, direction: 'asc' }, ...sorts.value.filter((sort) => sort.key !== column.key)]
    }
}

// Only the most recently chosen column shows an indicator
const sortIcon = (column) => {
    const [primary] = sorts.value
    if (primary?.key !== column.key) return null
    return primary.direction === 'asc' ? ChevronUpIcon : ChevronDownIcon
}

const ariaSort = (column) => {
    if (sorts.value[0]?.key !== column.key) return null
    return sorts.value[0].direction === 'asc' ? 'ascending' : 'descending'
}

const isEmptyValue = (value) => value === null || value === undefined || value === ''

const compareRows = (a, b) => {
    for (const { key, direction } of sorts.value) {
        const column = columnByKey.value.get(key)
        if (!column) continue
        const aValue = column.sortValue(a)
        const bValue = column.sortValue(b)
        const aEmpty = isEmptyValue(aValue)
        const bEmpty = isEmptyValue(bValue)
        if (aEmpty && bEmpty) continue
        // Blank values always sort last, regardless of direction
        if (aEmpty) return 1
        if (bEmpty) return -1
        const comparison = typeof aValue === 'string' ? aValue.localeCompare(String(bValue)) : Number(aValue) - Number(bValue)
        if (comparison !== 0) return direction === 'asc' ? comparison : -comparison
    }
    return 0
}

const sortRows = (rows) => (sorts.value.length > 0 ? [...rows].sort(compareRows) : rows)

// Sections
const sections = computed(() => {
    if (props.groups) {
        return props.groups.map((group) => ({ id: group.id, name: group.name, items: sortRows(group.items) }))
    }
    return props.items.length > 0 ? [{ id: null, name: '', items: sortRows(props.items) }] : []
})

const groupCollapsedState = ref({})
if (props.groupPersistenceKey) {
    useFilterPersistence(props.groupPersistenceKey, { groupCollapsedState })
}

const isGroupCollapsed = (section) => section.id !== null && !!groupCollapsedState.value[section.id]

const toggleGroup = (groupId) => {
    groupCollapsedState.value = { ...groupCollapsedState.value, [groupId]: !groupCollapsedState.value[groupId] }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* The table may be wider than the FilterBar, so only the FilterBar uses ItemCardsLayout's constrained widths */
.item-table-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    width: 100%;
}

.filter-bar-wrapper {
    width: 90%;
    max-width: 1110px;
}

@media (min-width: 1623px) {
    .filter-bar-wrapper {
        max-width: 1480px;
    }
}

@media (max-width: 1211px) {
    .filter-bar-wrapper {
        max-width: 720px;
    }
}

@media (max-width: 799px) {
    .filter-bar-wrapper {
        max-width: 350px;
    }
}

.table-scroll {
    max-width: 95vw;
}

.item-table {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
    border-radius: var(--radius-10);
    font-size: var(--font-size-12);
    color: var(--color-text-primary);
    background: var(--overlay-black-heavy);
}

.item-table th,
.item-table td {
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--color-border-secondary);
    text-align: left;
    vertical-align: middle;
    box-sizing: border-box;
}

.item-table thead th {
    position: sticky;
    top: var(--nav-height);
    z-index: var(--z-raised);
    background: var(--color-bg-secondary);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
    vertical-align: bottom;
}

.item-table .column-divider {
    border-left: 1px solid var(--color-border-secondary);
}

/* Round the corners manually; clipping the table would hide the sticky header */
.item-table thead th:first-child {
    border-top-left-radius: var(--radius-10);
}

.item-table thead th:last-child {
    border-top-right-radius: var(--radius-10);
}

.item-table tbody:last-of-type tr:last-child td:first-child {
    border-bottom-left-radius: var(--radius-10);
}

.item-table tbody:last-of-type tr:last-child td:last-child {
    border-bottom-right-radius: var(--radius-10);
}

.item-table .header-column--narrow,
.item-table .cell--narrow {
    width: 1%;
    padding-left: var(--space-xs);
    padding-right: var(--space-xs);
    text-align: center;
}

.item-table .cell--flush-left {
    padding-left: 0;
}

/* Zero-width so the label never sizes the (spanned) columns; the text overflows to the right */
.header-group-label {
    display: inline-block;
    width: 0;
    white-space: nowrap;
}

.item-table .cell--keeping {
    font-size: var(--font-size-14);
    white-space: nowrap;
    text-align: right;
}

.header-icon {
    position: relative;
    top: 3px;
    width: 20px !important;
    height: 20px !important;
    fill: currentColor;
}

.header-icon :deep(path) {
    fill: currentColor;
}

.header-tooltip {
    position: fixed;
    z-index: var(--z-tooltip);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-text-primary);
    box-shadow: var(--shadow-elevation-md);
    font-size: var(--font-size-12);
    transform: translateX(-50%);
    pointer-events: none;
}

.sort-header-button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 0;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.sort-header-button:hover {
    color: var(--color-primary);
}

/* Icon headers show the caret centered over a dimmed icon, so column width never changes */
.sort-header-button--icon {
    position: relative;
}

.sort-header-button--icon .sort-icon-slot {
    position: absolute;
    left: 50%;
    top: calc(50% + 3px);
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
}

.sort-header-button--icon .sort-icon {
    width: 14px;
    height: 14px;
}

.sort-header-button--icon.is-sorted .header-icon {
    opacity: 0.35;
}

.sort-header-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.sort-icon-slot {
    display: inline-flex;
    flex-shrink: 0;
    width: 10px;
    height: 10px;
}

.sort-icon {
    width: 10px;
    height: 10px;
    color: var(--color-primary);
}

.item-row--alt td {
    background-color: var(--overlay-white-subtle);
}

.item-row:hover td {
    background-color: var(--overlay-white-medium);
}

/* Reveal zero-cost add badges when hovering anywhere on the row */
.item-row:hover :deep(.badge-hidden-until-hover) {
    opacity: 1;
    pointer-events: auto;
}

.group-row td {
    padding: var(--space-md) var(--space-md) 0;
    border-bottom: none;
}

.group-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    position: sticky;
    left: 0;
    width: max-content;
    padding-bottom: var(--space-sm);
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    cursor: pointer;
    user-select: none;
    transition: var(--transition-color);
}

.group-header:hover {
    color: var(--color-primary-hover);
}

.group-chevron {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.group-count {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
}

.empty-cell {
    text-align: center !important;
    color: var(--color-text-secondary);
    font-style: italic;
}
</style>
