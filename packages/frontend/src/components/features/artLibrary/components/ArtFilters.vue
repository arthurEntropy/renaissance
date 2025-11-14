<template>
    <div class="filters-container">
        <div class="filters-row">
            <!-- Type Filter with Toggle Buttons -->
            <div class="type-toggle">
                <button type="button" class="type-button faces" :class="{ selected: typeFilters.includes('faces') }"
                    @click="toggleTypeFilter('faces')">
                    <UserCircleIcon class="icon-sm" />
                    <span>Faces</span>
                </button>
                <button type="button" class="type-button places" :class="{ selected: typeFilters.includes('places') }"
                    @click="toggleTypeFilter('places')">
                    <PhotoIcon class="icon-sm" />
                    <span>Places</span>
                </button>
                <button type="button" class="type-button maps" :class="{ selected: typeFilters.includes('maps') }"
                    @click="toggleTypeFilter('maps')">
                    <MapIcon class="icon-sm" />
                    <span>Maps</span>
                </button>
            </div>

            <!-- Source Filter with Combobox -->
            <div class="combobox-wrapper" ref="comboboxRef">
                <input v-model="searchQuery" @focus="handleFocus" @input="showDropdown = true"
                    @keydown.enter.prevent="selectFirstMatch" @keydown.down.prevent="navigateDown"
                    @keydown.up.prevent="navigateUp" @keydown.escape="showDropdown = false"
                    placeholder="Filter by tags..." class="filter-select combobox-input" type="text" />
                <div v-if="showDropdown" class="dropdown-list">
                    <template v-if="hasFilteredSources">
                        <div v-for="(group, groupName) in filteredSources" :key="groupName" class="dropdown-group">
                            <div class="dropdown-group-label">{{ groupName }}</div>
                            <div v-for="(item, index) in group" :key="item.id"
                                :class="['dropdown-option', { highlighted: highlightedIndex === getOptionIndex(groupName, index) }]"
                                @click="selectSource(item.id)"
                                @mouseenter="highlightedIndex = getOptionIndex(groupName, index)">
                                {{ item.name }}
                            </div>
                        </div>
                    </template>
                    <div v-else class="dropdown-empty">
                        No tags found
                    </div>
                </div>
            </div>

            <!-- Selected Source Tags -->
            <div v-if="sourceFilters.length > 0" class="selected-chips">
                <div v-for="sourceId in sourceFilters" :key="sourceId" class="chip">
                    <span class="chip-text">{{ getSourceName(sourceId) }}</span>
                    <button class="chip-remove" @click="removeSourceFilter(sourceId)" type="button">
                        <XMarkIcon class="chip-icon" />
                    </button>
                </div>
            </div>

            <!-- Size Toggle -->
            <div class="size-toggle">
                <button type="button" class="size-button" :class="{ selected: gridSize === 'large' }"
                    @click="gridSize = 'large'">
                    Large
                </button>
                <button type="button" class="size-button" :class="{ selected: gridSize === 'small' }"
                    @click="gridSize = 'small'">
                    Small
                </button>
            </div>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
            <div class="stats-items">
                <span class="stat-item">
                    Total: <strong>{{ totalCount }}</strong>
                </span>
                <span class="stat-item">
                    Faces: <strong>{{ faceCount }}</strong>
                </span>
                <span class="stat-item">
                    Places: <strong>{{ placeCount }}</strong>
                </span>
                <span class="stat-item">
                    Maps: <strong>{{ mapCount }}</strong>
                </span>
            </div>

            <div class="stats-controls">
                <!-- Group By -->
                <select v-model="groupBy" class="control-select">
                    <option value="">Group by...</option>
                    <option value="type">Type</option>
                    <option value="ancestry">Ancestry</option>
                    <option value="culture">Culture</option>
                    <option value="mestieri">Mestieri</option>
                    <option value="worldElement">World Element</option>
                    <option value="dateAddedOldToNew">Date - Old to New</option>
                    <option value="dateAddedNewToOld">Date - New to Old</option>
                </select>

                <!-- Order By -->
                <select v-model="orderBy" class="control-select">
                    <option value="">Order by...</option>
                    <option value="type">Type</option>
                    <option value="ancestry">Ancestry</option>
                    <option value="culture">Culture</option>
                    <option value="mestieri">Mestieri</option>
                    <option value="worldElement">World Element</option>
                    <option value="dateAddedOldToNew">Date - Old to New</option>
                    <option value="dateAddedNewToOld">Date - New to Old</option>
                </select>

                <!-- Show Duplicates -->
                <ActionButton :variant="showDuplicates ? 'danger' : 'neutral'" size="small"
                    :text="showDuplicates ? 'Show All' : 'Show Duplicates'" @click="showDuplicates = !showDuplicates" />

                <ActionButton variant="primary" size="small" text="+ Add Art" @click="$emit('add')" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { UserCircleIcon, PhotoIcon, MapIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import { SPECIAL_FILTERS } from '../composables/useArtFilters'

defineProps({
    totalCount: {
        type: Number,
        required: true
    },
    faceCount: {
        type: Number,
        required: true
    },
    placeCount: {
        type: Number,
        required: true
    },
    mapCount: {
        type: Number,
        required: true
    }
})

defineEmits(['add'])

const gridSize = defineModel('gridSize')
const typeFilters = defineModel('typeFilters')
const sourceFilters = defineModel('sourceFilters')
const groupBy = defineModel('groupBy')
const orderBy = defineModel('orderBy')
const showDuplicates = defineModel('showDuplicates')

const sourcesStore = useSourcesStore()

// Combobox state
const searchQuery = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const comboboxRef = ref(null)

// Special filter options
const specialFilterOptions = [
    { id: SPECIAL_FILTERS.NO_TAGS, name: 'No Tags' },
    { id: SPECIAL_FILTERS.NO_ANCESTRY, name: 'No Ancestry Tag' },
    { id: SPECIAL_FILTERS.NO_CULTURE, name: 'No Culture Tag' },
    { id: SPECIAL_FILTERS.NO_MESTIERI, name: 'No Mestieri Tag' }
]

// All sources organized by group
const allSourceGroups = computed(() => ({
    'Special Filters': specialFilterOptions,
    'Ancestries': sourcesStore.sources.ancestries || [],
    'Cultures': sourcesStore.sources.cultures || [],
    'Mestieri': sourcesStore.sources.mestieri || [],
    'World Elements': sourcesStore.sources.worldElements || []
}))

// Filtered sources based on search query
const filteredSources = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()

    if (!query) {
        return allSourceGroups.value
    }

    const filtered = {}
    for (const [groupName, items] of Object.entries(allSourceGroups.value)) {
        const matchingItems = items.filter(item =>
            item.name.toLowerCase().includes(query)
        )
        if (matchingItems.length > 0) {
            filtered[groupName] = matchingItems
        }
    }
    return filtered
})

// Check if there are any filtered sources to display
const hasFilteredSources = computed(() => {
    return Object.values(filteredSources.value).some(group => group.length > 0)
})

// Get flat list of all filtered options for keyboard navigation
const flatFilteredOptions = computed(() => {
    const options = []
    for (const [groupName, items] of Object.entries(filteredSources.value)) {
        items.forEach((item, index) => {
            options.push({ groupName, index, item })
        })
    }
    return options
})

// Get the global index for an option based on group and local index
const getOptionIndex = (groupName, localIndex) => {
    let globalIndex = 0
    for (const [gName, items] of Object.entries(filteredSources.value)) {
        if (gName === groupName) {
            return globalIndex + localIndex
        }
        globalIndex += items.length
    }
    return -1
}

const getSourceName = (sourceId) => {
    // Check if it's a special filter
    const specialFilter = specialFilterOptions.find(f => f.id === sourceId)
    if (specialFilter) return specialFilter.name

    // Otherwise look in regular sources
    const allSources = [
        ...sourcesStore.sources.ancestries || [],
        ...sourcesStore.sources.cultures || [],
        ...sourcesStore.sources.mestieri || [],
        ...sourcesStore.sources.worldElements || []
    ]
    const source = allSources.find(s => s.id === sourceId)
    return source ? source.name : 'Unknown'
}

const toggleTypeFilter = (type) => {
    const index = typeFilters.value.indexOf(type)
    if (index > -1) {
        typeFilters.value.splice(index, 1)
    } else {
        typeFilters.value.push(type)
    }
}

const handleFocus = () => {
    showDropdown.value = true
}

const selectSource = (sourceId) => {
    if (sourceId && !sourceFilters.value.includes(sourceId)) {
        sourceFilters.value.push(sourceId)
    }
    searchQuery.value = ''
    showDropdown.value = false
    highlightedIndex.value = -1
}

const selectFirstMatch = () => {
    if (flatFilteredOptions.value.length > 0) {
        const firstOption = flatFilteredOptions.value[0]
        selectSource(firstOption.item.id)
    }
}

const navigateDown = () => {
    if (flatFilteredOptions.value.length === 0) return
    highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        flatFilteredOptions.value.length - 1
    )
    if (highlightedIndex.value >= 0 && highlightedIndex.value < flatFilteredOptions.value.length) {
        const option = flatFilteredOptions.value[highlightedIndex.value]
        selectSource(option.item.id)
    }
}

const navigateUp = () => {
    if (flatFilteredOptions.value.length === 0) return
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
    if (highlightedIndex.value >= 0 && highlightedIndex.value < flatFilteredOptions.value.length) {
        const option = flatFilteredOptions.value[highlightedIndex.value]
        selectSource(option.item.id)
    }
}

const removeSourceFilter = (sourceId) => {
    const index = sourceFilters.value.indexOf(sourceId)
    if (index > -1) {
        sourceFilters.value.splice(index, 1)
    }
}

// Click outside to close dropdown
const handleClickOutside = (event) => {
    if (comboboxRef.value && !comboboxRef.value.contains(event.target)) {
        showDropdown.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.filters-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    padding: var(--space-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    overflow: visible;
}

.filters-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
    position: relative;
}

.stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-lg);
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border-secondary);
    flex-wrap: wrap;
}

.stats-items {
    display: flex;
    gap: var(--space-lg);
}

.stats-controls {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    flex-wrap: wrap;
}

.control-select {
    min-width: 140px;
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-13);
    cursor: pointer;
    transition: var(--transition-all);
}

.control-select:hover {
    border-color: var(--color-border-primary);
}

.control-select:focus {
    outline: none;
    border-color: var(--color-primary);
}

.stat-item strong {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
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
    font-family: var(--font-family-base);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: var(--transition-all);
}

.size-button:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.size-button.selected {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
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
    transition: var(--transition-all);
    opacity: 0.5;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
}

.type-button.faces {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(96, 165, 250);
}

.type-button.places {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(52, 211, 153);
}

.type-button.maps {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(248, 113, 113);
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

.filter-select {
    min-width: 200px;
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
}

.filter-select:focus {
    outline: none;
    border-color: var(--color-primary);
}

.combobox-wrapper {
    position: relative;
    min-width: 200px;
    flex-shrink: 0;
}

.combobox-input {
    cursor: text;
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
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 1000;
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
    transition: var(--transition-all);
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

.icon-sm {
    width: 16px;
    height: 16px;
}
</style>
