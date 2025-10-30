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
                <div v-for="artItem in paginatedArt" :key="artItem.id" class="art-card" @click="openEditModal(artItem)">
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

        <!-- Edit Modal -->
        <EditArtModal v-if="showEditModal" :art="selectedArt" :hasPrevious="hasPreviousArt" :hasNext="hasNextArt"
            @close="closeEditModal" @save="saveArt" @delete="deleteArt" @navigate="navigateArt" />
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
    showEditModal.value = true
}

const openEditModal = (artItem) => {
    selectedArt.value = artItem
    showEditModal.value = true
}

const closeEditModal = () => {
    showEditModal.value = false
    selectedArt.value = null
}

const saveArt = async (artData) => {
    try {
        if (artData.id) {
            // Update existing
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
    background: var(--color-gray-medium);
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
