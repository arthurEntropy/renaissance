<template>
    <div class="art-page">
        <!-- Filters and Controls -->
        <div class="filters-container">
            <div class="filters-row">
                <!-- Type Filter with Toggle Buttons -->
                <div class="type-toggle">
                    <button type="button" class="type-button faces" :class="{ selected: typeFilters.includes('faces') }"
                        @click="toggleTypeFilter('faces')">
                        <UserCircleIcon class="icon-sm" />
                        <span>Faces</span>
                    </button>
                    <button type="button" class="type-button places"
                        :class="{ selected: typeFilters.includes('places') }" @click="toggleTypeFilter('places')">
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
                        Total: <strong>{{ filteredArt.length }}</strong>
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
                <ActionButton variant="primary" size="small" text="+ Add Art" @click="openAddModal" />
            </div>
        </div>

        <!-- Art Grid -->
        <div class="art-grid-container">
            <div v-if="paginatedArt.length > 0" class="art-grid" :class="`grid-size-${gridSize}`">
                <div v-for="artItem in paginatedArt" :key="artItem.id" class="art-card"
                    :class="{ 'selected': selectedItems.includes(artItem.id) }"
                    @click="handleCardClick($event, artItem)" :data-art-id="artItem.id">
                    <div class="art-image">
                        <img :src="artItem.url" :alt="`Art ${artItem.id}`" />
                    </div>
                    <div class="art-info">
                        <div class="art-tags">
                            <span class="art-type" :class="artItem.tags.type">
                                <UserCircleIcon v-if="artItem.tags.type === 'faces'" class="icon-sm" />
                                <PhotoIcon v-if="artItem.tags.type === 'places'" class="icon-sm" />
                                <MapIcon v-if="artItem.tags.type === 'maps'" class="icon-sm" />
                            </span>
                            <span v-for="sourceId in artItem.tags.sources" :key="sourceId" class="art-source-tag">
                                {{ getSourceName(sourceId) }}
                            </span>
                        </div>
                    </div>
                    <!-- Selection indicator -->
                    <div v-if="selectedItems.includes(artItem.id)" class="selection-indicator">
                        <div class="selection-checkmark">✓</div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredArt.length === 0" class="empty-state">
                <p>No art found matching your filters.</p>
                <ActionButton variant="primary" size="large" text="Add First Art" @click="openAddModal" />
            </div>
        </div>

        <!-- Loading indicator for infinite scroll -->
        <div v-if="hasMore" class="loading-indicator" ref="loadingIndicatorRef">
            <span class="loading-text">Loading more art...</span>
        </div>

        <!-- Edit Multiple Button -->
        <div v-if="selectedItems.length > 0" class="edit-multiple-bar">
            <span class="selected-count">{{ selectedItems.length }} item{{ selectedItems.length !== 1 ? 's' : '' }}
                selected</span>
            <ActionButton variant="primary" size="large" text="Edit Multiple" @click="openMultiEditModal" />
        </div>

        <!-- Edit Modal -->
        <EditArtModal v-if="showEditModal" :art="selectedArt" :hasPrevious="hasPreviousArt" :hasNext="hasNextArt"
            :isMultiEdit="isMultiEdit" :multiEditData="multiEditData" @close="closeEditModal" @save="saveArt"
            @delete="deleteArt" @navigate="navigateArt" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import EditArtModal from '@/components/editModals/EditArtModal.vue'
import SourceOptionsGroup from '@/components/ui/selectors/SourceOptionsGroup.vue'
import ArtService from '@/services/artService'
import { UserCircleIcon, PhotoIcon, MapIcon, XMarkIcon } from '@heroicons/vue/24/outline'

// Stores
const artStore = useArtStore()
const sourcesStore = useSourcesStore()

// State
const gridSize = ref('large')
const typeFilters = ref([])
const sourceFilters = ref([])
const sourceFilter = ref('')
const showEditModal = ref(false)
const selectedArt = ref(null)
const loadingIndicatorRef = ref(null)
const selectedItems = ref([])
const isMultiEdit = ref(false)
let intersectionObserver = null

// Computed
const filteredArt = computed(() => {
    let filtered = artStore.art

    // Filter by types (if any selected)
    if (typeFilters.value.length > 0) {
        filtered = filtered.filter(art => typeFilters.value.includes(art.tags.type))
    }

    // Filter by sources (must match ALL selected sources)
    if (sourceFilters.value.length > 0) {
        filtered = filtered.filter(art =>
            sourceFilters.value.every(sourceId => art.tags.sources.includes(sourceId))
        )
    }

    return filtered
})

// Infinite scroll
const { paginatedItems: paginatedArt, loadMore, hasMore } = useInfiniteScroll(filteredArt, 50)

// Navigation
const hasPreviousArt = computed(() => {
    if (!selectedArt.value) return false
    const currentIndex = filteredArt.value.findIndex(art => art.id === selectedArt.value.id)
    return currentIndex > 0
})

const hasNextArt = computed(() => {
    if (!selectedArt.value) return false
    const currentIndex = filteredArt.value.findIndex(art => art.id === selectedArt.value.id)
    return currentIndex < filteredArt.value.length - 1
})

const navigateArt = (direction) => {
    if (!selectedArt.value) return
    const currentIndex = filteredArt.value.findIndex(art => art.id === selectedArt.value.id)
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < filteredArt.value.length) {
        selectedArt.value = filteredArt.value[newIndex]
    }
}

const faceCount = computed(() => {
    return artStore.art.filter(art => art.tags.type === 'faces').length
})

const placeCount = computed(() => {
    return artStore.art.filter(art => art.tags.type === 'places').length
})

const mapCount = computed(() => {
    return artStore.art.filter(art => art.tags.type === 'maps').length
})

// Multi-edit aggregated data
const multiEditData = computed(() => {
    if (!isMultiEdit.value || selectedItems.value.length === 0) {
        return null
    }

    const selectedArts = selectedItems.value.map(id => artStore.getById(id)).filter(Boolean)

    if (selectedArts.length === 0) {
        return null
    }

    // Aggregate all unique sources from selected items
    const allSources = new Set()
    const sourceItemCounts = {} // Track how many items have each source

    selectedArts.forEach(art => {
        art.tags.sources.forEach(sourceId => {
            allSources.add(sourceId)
            sourceItemCounts[sourceId] = (sourceItemCounts[sourceId] || 0) + 1
        })
    })

    // Determine which sources are on all items vs some items
    const universalSources = [] // On all items
    const partialSources = [] // On some but not all items

    allSources.forEach(sourceId => {
        if (sourceItemCounts[sourceId] === selectedArts.length) {
            universalSources.push(sourceId)
        } else {
            partialSources.push(sourceId)
        }
    })

    // For type, use the most common type, or 'faces' as default
    const typeCounts = {}
    selectedArts.forEach(art => {
        typeCounts[art.tags.type] = (typeCounts[art.tags.type] || 0) + 1
    })
    const mostCommonType = Object.keys(typeCounts).reduce((a, b) =>
        typeCounts[a] > typeCounts[b] ? a : b, 'faces'
    )

    return {
        type: mostCommonType,
        universalSources, // Sources that ALL items have
        partialSources,   // Sources that SOME items have
        itemCount: selectedArts.length
    }
})

// Helper to get source name by ID
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

// Filter methods
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

// Methods
const openAddModal = () => {
    selectedArt.value = null
    isMultiEdit.value = false
    showEditModal.value = true
}

const openEditModal = (artItem) => {
    selectedArt.value = artItem
    isMultiEdit.value = false
    showEditModal.value = true
}

const openMultiEditModal = () => {
    selectedArt.value = null
    isMultiEdit.value = true
    showEditModal.value = true
}

const closeEditModal = () => {
    showEditModal.value = false
    selectedArt.value = null
    isMultiEdit.value = false
}

// Multi-select methods
const handleCardClick = (event, artItem) => {
    if (event.shiftKey) {
        // Toggle selection when shift is held
        event.preventDefault()
        toggleSelection(artItem.id)
    } else if (selectedItems.value.length === 0) {
        // Normal click behavior when no items selected
        openEditModal(artItem)
    }
}

const toggleSelection = (artId) => {
    const index = selectedItems.value.indexOf(artId)
    if (index > -1) {
        selectedItems.value.splice(index, 1)
    } else {
        selectedItems.value.push(artId)
    }
}

const saveArt = async (artData) => {
    try {
        if (artData.isMultiEdit) {
            // Update multiple items with add/remove logic
            const updates = selectedItems.value.map(async (artId) => {
                const art = artStore.getById(artId)
                if (art) {
                    // Start with existing sources
                    let updatedSources = [...art.tags.sources]

                    // Remove sources that should be removed
                    updatedSources = updatedSources.filter(id => !artData.sourcesToRemove.includes(id))

                    // Add sources that should be added (avoid duplicates)
                    artData.sourcesToAdd.forEach(id => {
                        if (!updatedSources.includes(id)) {
                            updatedSources.push(id)
                        }
                    })

                    const updatedArt = {
                        ...art,
                        tags: {
                            type: artData.type,
                            sources: updatedSources
                        }
                    }
                    await ArtService.update(updatedArt)
                    artStore.updateArt(updatedArt)
                }
            })
            await Promise.all(updates)
            selectedItems.value = []
            closeEditModal()
        } else if (artData.id) {
            // Update existing single item
            await ArtService.update(artData)
            artStore.updateArt(artData)
        } else {
            // Create new
            const newArt = await ArtService.create(artData)
            artStore.addArt(newArt)
            closeEditModal()
        }
    } catch (error) {
        console.error('Error saving art:', error)
        alert('Failed to save art. Please try again.')
    }
}

const deleteArt = async (artData) => {
    try {
        await ArtService.delete(artData)
        artStore.removeArt(artData.id)
        closeEditModal()
    } catch (error) {
        console.error('Error deleting art:', error)
        alert('Failed to delete art. Please try again.')
    }
}

// Setup intersection observer for infinite scroll
const setupIntersectionObserver = () => {
    if (!loadingIndicatorRef.value) return

    intersectionObserver = new IntersectionObserver(
        (entries) => {
            const entry = entries[0]
            if (entry.isIntersecting && hasMore.value) {
                loadMore()
            }
        },
        {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        }
    )

    intersectionObserver.observe(loadingIndicatorRef.value)
}

// Lifecycle
onMounted(async () => {
    await Promise.all([
        artStore.fetch(),
        sourcesStore.fetchSources()
    ])
    setupIntersectionObserver()
})

onBeforeUnmount(() => {
    if (intersectionObserver) {
        intersectionObserver.disconnect()
    }
})
</script>

<style scoped>
.art-page {
    max-width: 1400px;
    min-width: min(100%, 1200px);
    margin: 0 auto;
    padding: var(--space-xl);
}

/* Filters Container */
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

/* Size Toggle */
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

.filter-select,
.filter-input {
    padding: var(--space-sm);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
}

/* Art Grid */
.art-grid-container {
    min-width: 100%;
}

/* Large Grid (default) */
.art-grid.grid-size-large {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg);
}

@media (min-width: 1400px) {
    .art-grid.grid-size-large {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 1100px) {
    .art-grid.grid-size-large {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .art-grid.grid-size-large {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .art-grid.grid-size-large {
        grid-template-columns: 1fr;
    }
}

/* Small Grid (1/4 size - 8 columns) */
.art-grid.grid-size-small {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md);
}

@media (min-width: 1400px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(8, 1fr);
    }
}

@media (max-width: 1100px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(6, 1fr);
    }
}

@media (max-width: 768px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 480px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Small size adjustments */
.art-grid.grid-size-small .art-card {
    border-radius: var(--radius-5);
}

.art-grid.grid-size-small .art-image {
    aspect-ratio: 1;
}

.art-grid.grid-size-small .art-info {
    padding: var(--space-xs);
}

.art-grid.grid-size-small .art-tags {
    gap: 2px;
}

.art-grid.grid-size-small .art-type {
    padding: 2px 4px;
}

.art-grid.grid-size-small .art-source-tag {
    padding: 2px 4px;
    font-size: var(--font-size-10);
}

.art-card {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-all);
    box-shadow: var(--shadow-elevation-sm);
}

.art-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-elevation-md);
}

.art-image {
    width: 100%;
    aspect-ratio: 1;
    background: var(--color-bg-tertiary);
    overflow: hidden;
}

.art-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.art-info {
    padding: var(--space-md);
}

.art-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
}

.art-type {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
}

.art-type.faces {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(96, 165, 250);
}

.art-type.places {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(52, 211, 153);
}

.art-type.maps {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(248, 113, 113);
}

.art-source-tag {
    display: inline-block;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    background: var(--color-gray-dark);
    color: var(--color-text-secondary);
}

.icon-sm {
    width: 16px;
    height: 16px;
}

/* Loading Indicator */
.loading-indicator {
    padding: var(--space-xl);
    text-align: center;
    width: 100%;
}

.loading-text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--space-xl) var(--space-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    color: var(--color-text-secondary);
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.empty-state p {
    margin-bottom: var(--space-lg);
    font-size: var(--font-size-18);
}

/* Selection state */
.art-card {
    position: relative;
}

.art-card.selected {
    outline: 3px solid var(--color-text-primary);
    outline-offset: -3px;
}

.selection-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: var(--color-text-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-elevation-md);
    z-index: 10;
}

.selection-checkmark {
    color: var(--color-primary-text);
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-bold);
    line-height: 1;
}

/* Edit Multiple Bar */
.edit-multiple-bar {
    position: fixed;
    bottom: var(--space-xl);
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-10);
    padding: var(--space-md) var(--space-lg);
    box-shadow: var(--shadow-elevation-lg);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    z-index: 100;
}

.selection-count {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-medium);
}

/* Responsive */
@media (max-width: var(--breakpoint-md)) {
    .art-page {
        padding: var(--space-md);
    }

    .art-header {
        flex-direction: column;
        gap: var(--space-md);
        align-items: stretch;
    }

    .art-filters {
        grid-template-columns: 1fr;
    }

    .search-group {
        grid-column: span 1;
    }

    .art-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--space-md);
    }

    .art-stats {
        flex-direction: column;
        gap: var(--space-sm);
    }
}
</style>
