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

            <!-- Source Filter with Dropdown -->
            <select v-model="sourceFilter" @change="addSourceFilter" class="filter-select">
                <option value="">Filter by tags...</option>
                <SourceOptionsGroup />
            </select>

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
            <ActionButton variant="primary" size="small" text="+ Add Art" @click="$emit('add')" />
        </div>
    </div>
</template>

<script setup>
import { UserCircleIcon, PhotoIcon, MapIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SourceOptionsGroup from '@/components/ui/selectors/SourceOptionsGroup.vue'
import { useSourcesStore } from '@/stores/sourcesStore'

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
const sourceFilter = defineModel('sourceFilter')

const sourcesStore = useSourcesStore()

const getSourceName = (sourceId) => {
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

const addSourceFilter = () => {
    if (sourceFilter.value && !sourceFilters.value.includes(sourceFilter.value)) {
        sourceFilters.value.push(sourceFilter.value)
    }
    sourceFilter.value = ''
}

const removeSourceFilter = (sourceId) => {
    const index = sourceFilters.value.indexOf(sourceId)
    if (index > -1) {
        sourceFilters.value.splice(index, 1)
    }
}
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
}

.filters-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
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
}

.stats-items {
    display: flex;
    gap: var(--space-lg);
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
