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
            <input v-if="showSearch" v-model="localSearchQuery" class="filter-input search-input"
                :placeholder="searchPlaceholder" type="text" aria-label="Search" />

            <!-- Tag Picker -->
            <div v-if="tagGroups.length > 0" class="combobox-wrapper" ref="comboboxRef">
                <!-- Flat Combobox Mode -->
                <template v-if="!isCascadeMode">
                    <input v-model="comboboxSearch" @focus="showDropdown = true" @input="showDropdown = true"
                        @keydown.enter.prevent="selectFirstMatch" @keydown.down.prevent="navigateDown"
                        @keydown.up.prevent="navigateUp" @keydown.escape="showDropdown = false"
                        :placeholder="tagSearchPlaceholder" class="filter-input combobox-input" type="text" />
                    <div v-if="showDropdown" class="dropdown-list">
                        <template v-if="hasFilteredGroups">
                            <div v-for="group in filteredTagGroups" :key="group.label" class="dropdown-group">
                                <div class="dropdown-group-label">{{ group.label }}</div>
                                <div v-for="(item, index) in group.items" :key="item.id"
                                    :class="['dropdown-option', { highlighted: highlightedIndex === getGlobalIndex(group.label, index) }]"
                                    @click="selectTag(item.id)"
                                    @mouseenter="highlightedIndex = getGlobalIndex(group.label, index)">
                                    {{ item.name }}
                                </div>
                            </div>
                        </template>
                        <div v-else class="dropdown-empty">No tags found</div>
                    </div>
                </template>

                <!-- Cascade Mode -->
                <template v-else>
                    <button type="button" class="filter-input combobox-input combobox-trigger" @click="toggleDropdown">
                        <span>{{ tagSearchPlaceholder }}</span>
                        <span class="combobox-chevron">▾</span>
                    </button>

                    <div v-if="showDropdown" class="dropdown-list dropdown-list--cascade">
                        <!-- Left column: section headers + group entries + direct items -->
                        <div class="cascade-col">
                            <template v-for="entry in cascadeEntries" :key="entry.id">
                                <div v-if="entry.type === 'header'" class="cascade-section-label">{{ entry.label }}
                                </div>
                                <div v-else class="cascade-item-wrap"
                                    :class="{ active: activeCascadeEntryId === entry.id, 'cascade-item-wrap--leaf': entry.type === 'item' }"
                                    @mouseenter="handleCascadeHover(entry)" @click="handleCascadeSelect(entry)">
                                    <button class="cascade-btn" :class="{ 'cascade-btn--leaf': entry.type === 'item' }"
                                        tabindex="-1">
                                        <span class="cascade-btn-label">{{ entry.label }}</span>
                                        <span v-if="entry.type === 'group'" class="cascade-chevron">›</span>
                                    </button>
                                </div>
                            </template>
                        </div>

                        <!-- Right column: options within active group -->
                        <div v-if="activeCascadeGroup" class="cascade-col">
                            <input v-model="cascadeSearch" class="cascade-search" placeholder="Search tags..."
                                @keydown.escape="showDropdown = false" />
                            <div v-if="filteredCascadeOptions.length > 0" class="cascade-items-list">
                                <div v-for="option in filteredCascadeOptions" :key="option.id" class="cascade-item-wrap"
                                    :class="{ active: activeCascadeOptionId === option.id, 'cascade-item-wrap--leaf': !option.items || option.items.length === 0 }"
                                    @mouseenter="handleCascadeOptionHover(option)"
                                    @click="handleCascadeOptionSelect(option)">
                                    <button class="cascade-btn"
                                        :class="{ 'cascade-btn--leaf': !option.items || option.items.length === 0 }"
                                        tabindex="-1">
                                        <span class="cascade-btn-label">{{ option.name }}</span>
                                        <span v-if="option.items && option.items.length > 0"
                                            class="cascade-chevron">›</span>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="cascade-empty">No tags found</div>
                        </div>

                        <!-- Third column: options within active subgroup -->
                        <div v-if="activeCascadeSubgroup" class="cascade-col">
                            <div class="cascade-section-label">{{ activeCascadeSubgroup.name }}</div>
                            <div v-if="filteredCascadeSubOptions.length > 0" class="cascade-items-list">
                                <div v-for="option in filteredCascadeSubOptions" :key="option.id"
                                    class="cascade-item-wrap cascade-item-wrap--leaf" @click="selectTag(option.id)">
                                    <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                                        <span class="cascade-btn-label">{{ option.name }}</span>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="cascade-empty">No tags found</div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Selected Tag Chips -->
            <div v-if="localSelectedTags.length > 0" class="selected-chips">
                <div v-for="tagId in localSelectedTags" :key="tagId" class="chip">
                    <span class="chip-text">{{ getTagName(tagId) }}</span>
                    <button class="chip-remove" @click="removeTag(tagId)" type="button">
                        <XMarkIcon class="chip-icon" />
                    </button>
                </div>
            </div>

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
import { ref, computed, watch, onMounted, onUnmounted, useSlots } from 'vue'
import { XMarkIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    // Tag groups: [{ label: String, items: [{ id, name }] }]
    tagGroups: {
        type: Array,
        default: () => []
    },
    tagPickerMode: {
        type: String,
        default: 'flat' // 'flat' | 'cascade'
    },
    // 'multi': add tags to selection; 'single': replace selection on pick
    multiselect: {
        type: Boolean,
        default: true
    },
    tagSearchPlaceholder: {
        type: String,
        default: 'Filter by tags...'
    },

    // Type toggle buttons: [{ value, label, icon?, colorClass? }]
    typeToggles: {
        type: Array,
        default: () => []
    },

    // Text search input (for item search, separate from tag picker)
    showSearch: {
        type: Boolean,
        default: true
    },
    searchPlaceholder: {
        type: String,
        default: 'Search...'
    },

    // Grid size toggle
    showSizeToggle: {
        type: Boolean,
        default: false
    },

    // Sort/Group pickers (Array or grouped Object, same as SortingPicker)
    groupOptions: {
        type: [Array, Object],
        default: () => []
    },
    orderOptions: {
        type: [Array, Object],
        default: () => []
    },

    // Stats items: [{ label: String, value: Number }]
    stats: {
        type: Array,
        default: () => []
    },

    // Add button
    showAddButton: {
        type: Boolean,
        default: false
    },
    addButtonLabel: {
        type: String,
        default: '+ Add'
    }
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

const isCascadeMode = computed(() => props.tagPickerMode === 'cascade')

// Picker state
const comboboxSearch = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const comboboxRef = ref(null)
const filterBarRef = ref(null)
const showToTopButton = ref(false)
const isFilterBarInView = ref(true)
const lastScrollY = ref(0)

let filterBarObserver = null

// Cascade state
const cascadeSearch = ref('')
const activeCascadeEntryId = ref('')
const activeCascadeOptionId = ref('')

const specialTagGroup = computed(() =>
    props.tagGroups.find((group) => group.label === 'Special Tags') || null
)

const regularCascadeGroups = computed(() =>
    props.tagGroups.filter((group) => group.label !== 'Special Tags')
)

const cascadeEntries = computed(() => {
    const entries = []

    // Special Filters section (Magical, Mundane, etc.) — shown first as direct leaf items or groups
    const specialItems = specialTagGroup.value?.items || []
    if (specialItems.length) {
        entries.push({ id: '__header__special', type: 'header', label: 'Special Filters' })
        for (const item of specialItems) {
            // If item has nested items, treat it as a group
            if (item.items && item.items.length > 0) {
                entries.push({ id: `group:${item.id}`, label: item.name, type: 'group', group: item })
            } else {
                // Otherwise treat it as a leaf item
                entries.push({ id: `item:${item.id}`, label: item.name, type: 'item', itemId: item.id })
            }
        }
    }

    // Sources section — all regular groups (Ancestries, Cultures, etc.)
    if (regularCascadeGroups.value.length) {
        entries.push({ id: '__header__sources', type: 'header', label: 'Sources' })
        for (const group of regularCascadeGroups.value) {
            entries.push({ id: `group:${group.label}`, label: group.label, type: 'group', group })
        }
    }

    return entries
})

const activeCascadeGroup = computed(() => {
    const entry = cascadeEntries.value.find((e) => e.id === activeCascadeEntryId.value)
    return entry?.type === 'group' ? entry.group : null
})

const filteredCascadeOptions = computed(() => {
    if (!activeCascadeGroup.value) return []
    const query = cascadeSearch.value.toLowerCase().trim()
    const options = activeCascadeGroup.value.items || []
    if (!query) return options
    return options.filter((item) => item.name.toLowerCase().includes(query))
})

const activeCascadeSubgroup = computed(() => {
    if (!activeCascadeGroup.value || !activeCascadeOptionId.value) return null
    const option = (activeCascadeGroup.value.items || []).find((item) => item.id === activeCascadeOptionId.value)
    if (!option?.items?.length) return null
    return option
})

const filteredCascadeSubOptions = computed(() => {
    if (!activeCascadeSubgroup.value) return []
    const query = cascadeSearch.value.toLowerCase().trim()
    const options = activeCascadeSubgroup.value.items || []
    if (!query) return options
    return options.filter((item) => item.name.toLowerCase().includes(query))
})

// Flat-mode filtering for existing behavior
const filteredTagGroups = computed(() => {
    const query = comboboxSearch.value.toLowerCase().trim()
    if (!query) return props.tagGroups
    return props.tagGroups
        .map(group => ({
            ...group,
            items: (group.items || []).filter(item =>
                item.name.toLowerCase().includes(query)
            )
        }))
        .filter(group => group.items.length > 0)
})

const hasFilteredGroups = computed(() => filteredTagGroups.value.length > 0)

const flatFilteredOptions = computed(() => {
    const options = []
    for (const group of filteredTagGroups.value) {
        for (const item of group.items) {
            options.push({ groupLabel: group.label, item })
        }
    }
    return options
})

const getGlobalIndex = (groupLabel, localIndex) => {
    let globalIndex = 0
    for (const group of filteredTagGroups.value) {
        if (group.label === groupLabel) return globalIndex + localIndex
        globalIndex += group.items.length
    }
    return -1
}

const getTagName = (tagId) => {
    const findById = (items) => {
        for (const item of (items || [])) {
            if (item.id === tagId) return item.name
            if (item.items && item.items.length > 0) {
                const nestedName = findById(item.items)
                if (nestedName) return nestedName
            }
        }
        return null
    }

    for (const group of props.tagGroups) {
        const name = findById(group.items)
        if (name) return name
    }
    return tagId
}

const selectTag = (tagId) => {
    if (props.multiselect) {
        if (!localSelectedTags.value.includes(tagId)) {
            localSelectedTags.value = [...localSelectedTags.value, tagId]
        }
    } else {
        if (localSelectedTags.value[0] !== tagId) {
            localSelectedTags.value = [tagId]
        }
    }
    comboboxSearch.value = ''
    cascadeSearch.value = ''
    activeCascadeOptionId.value = ''
    showDropdown.value = false
    highlightedIndex.value = -1
}

const removeTag = (tagId) => {
    localSelectedTags.value = localSelectedTags.value.filter(id => id !== tagId)
}

const toggleType = (value) => {
    const current = localSelectedTypes.value
    if (current.includes(value)) {
        localSelectedTypes.value = current.filter(v => v !== value)
    } else {
        localSelectedTypes.value = [...current, value]
    }
}

const selectFirstMatch = () => {
    if (isCascadeMode.value) return
    if (highlightedIndex.value >= 0 && highlightedIndex.value < flatFilteredOptions.value.length) {
        selectTag(flatFilteredOptions.value[highlightedIndex.value].item.id)
    } else if (flatFilteredOptions.value.length > 0) {
        selectTag(flatFilteredOptions.value[0].item.id)
    }
}

const navigateDown = () => {
    if (isCascadeMode.value || !flatFilteredOptions.value.length) return
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, flatFilteredOptions.value.length - 1)
}

const navigateUp = () => {
    if (isCascadeMode.value || !flatFilteredOptions.value.length) return
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
}

const handleCascadeHover = (entry) => {
    if (entry.type !== 'group') return
    activeCascadeEntryId.value = entry.id
    activeCascadeOptionId.value = ''
    cascadeSearch.value = ''
}

const handleCascadeSelect = (entry) => {
    if (entry.type === 'item') {
        selectTag(entry.itemId)
        return
    }
    activeCascadeEntryId.value = entry.id
    activeCascadeOptionId.value = ''
}

const handleCascadeOptionHover = (option) => {
    if (!option?.items?.length) {
        activeCascadeOptionId.value = ''
        return
    }
    activeCascadeOptionId.value = option.id
}

const handleCascadeOptionSelect = (option) => {
    if (option?.items?.length) {
        activeCascadeOptionId.value = option.id
        return
    }
    selectTag(option.id)
}

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
}

const updateToTopButtonVisibility = () => {
    const currentScrollY = window.scrollY || window.pageYOffset || 0
    const isScrollingUp = currentScrollY < lastScrollY.value
    showToTopButton.value = isScrollingUp && !isFilterBarInView.value && currentScrollY > 120
    lastScrollY.value = currentScrollY
}

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Click-outside to close dropdown
const handleClickOutside = (event) => {
    if (comboboxRef.value && !comboboxRef.value.contains(event.target)) {
        showDropdown.value = false
    }
}

watch(showDropdown, (isOpen) => {
    if (isOpen) {
        if (isCascadeMode.value) {
            activeCascadeEntryId.value = ''
            activeCascadeOptionId.value = ''
            cascadeSearch.value = ''
        }
        setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
    } else {
        document.removeEventListener('click', handleClickOutside)
    }
})

onMounted(() => {
    lastScrollY.value = window.scrollY || window.pageYOffset || 0

    if ('IntersectionObserver' in window && filterBarRef.value) {
        filterBarObserver = new IntersectionObserver(([entry]) => {
            isFilterBarInView.value = entry.isIntersecting
            if (entry.isIntersecting) {
                showToTopButton.value = false
            } else {
                updateToTopButtonVisibility()
            }
        }, {
            threshold: 0.05,
        })

        filterBarObserver.observe(filterBarRef.value)
    }

    window.addEventListener('scroll', updateToTopButtonVisibility, { passive: true })
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', updateToTopButtonVisibility)
    filterBarObserver?.disconnect()
    filterBarObserver = null
})

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
    !!slots.actions
)
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

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

.search-input {
    min-width: 180px;
    flex: 1;
    max-width: 280px;
}

.combobox-wrapper {
    position: relative;
    min-width: 200px;
    flex-shrink: 0;
}

.combobox-input {
    width: 100%;
    cursor: text;
}

.combobox-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

.combobox-chevron {
    color: var(--color-text-secondary);
    margin-left: var(--space-sm);
}

.dropdown-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .1), 0 2px 4px -1px rgba(0, 0, 0, .06);
    z-index: 1000;
}

.dropdown-list--cascade {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-xs);
    max-height: none;
    overflow: visible;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 4px 0;
}

.cascade-section-label {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    pointer-events: none;
    user-select: none;
}

.dropdown-group {
    padding: var(--space-xs) 0;
}

.dropdown-group:not(:last-child) {
    border-bottom: 1px solid var(--color-border-secondary);
}

.dropdown-group-label {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.dropdown-option {
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    transition: var(--transition-normal);
}

.dropdown-option:hover,
.dropdown-option.highlighted {
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
}

.dropdown-empty {
    padding: var(--space-md);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
}

.selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
    flex: 1;
    min-width: 220px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--radius-5);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
}

.chip-text {
    line-height: 1;
}

.chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-primary-text);
    transition: var(--transition-opacity);
}

.chip-remove:hover {
    opacity: 0.7;
}

.chip-icon {
    width: 14px;
    height: 14px;
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
    box-shadow: var(--shadow-glow-sm);
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
