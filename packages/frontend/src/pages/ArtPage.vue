<template>
    <div class="art-page">
        <div class="art-header">
            <h1>Art Library</h1>
            <ActionButton variant="primary" size="large" text="+ Add Art" @click="openAddModal" />
        </div>

        <!-- Filters -->
        <div class="art-filters">
            <div class="filter-group">
                <label for="type-filter">Type:</label>
                <select id="type-filter" v-model="typeFilter" class="filter-select">
                    <option value="">All Types</option>
                    <option value="faces">Faces</option>
                    <option value="places">Places</option>
                    <option value="maps">Maps</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="source-filter">Source:</label>
                <select id="source-filter" v-model="sourceFilter" class="filter-select">
                    <option value="">All Sources</option>
                    <SourceOptionsGroup />
                </select>
            </div>

            <div class="filter-group search-group">
                <label for="url-search">Search URL:</label>
                <input id="url-search" v-model="searchQuery" type="text" class="filter-input"
                    placeholder="Search by URL..." />
            </div>
        </div>

        <!-- Stats -->
        <div class="art-stats">
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

        <!-- Art Grid -->
        <div v-if="paginatedArt.length > 0" class="art-grid">
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

        <!-- Loading indicator for infinite scroll -->
        <div v-if="hasMore" class="loading-indicator" ref="loadingIndicatorRef">
            <span class="loading-text">Loading more art...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredArt.length === 0" class="empty-state">
            <p>No art found matching your filters.</p>
            <ActionButton variant="primary" size="large" text="Add First Art" @click="openAddModal" />
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
import { UserCircleIcon, PhotoIcon, MapIcon } from '@heroicons/vue/24/outline'

// Stores
const artStore = useArtStore()
const sourcesStore = useSourcesStore()

// State
const typeFilter = ref('')
const sourceFilter = ref('')
const searchQuery = ref('')
const showEditModal = ref(false)
const selectedArt = ref(null)
const loadingIndicatorRef = ref(null)
let intersectionObserver = null

// Computed
const filteredArt = computed(() => {
    let filtered = artStore.art

    // Filter by type
    if (typeFilter.value) {
        filtered = filtered.filter(art => art.tags.type === typeFilter.value)
    }

    // Filter by source
    if (sourceFilter.value) {
        filtered = filtered.filter(art =>
            art.tags.sources.includes(sourceFilter.value)
        )
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(art =>
            art.url.toLowerCase().includes(query)
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
    margin: 0 auto;
    padding: var(--space-xl);
}

.art-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xl);
}

.art-header h1 {
    margin: 0;
    color: var(--color-text-primary);
}

/* Filters */
.art-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    padding: var(--space-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.filter-group label {
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
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

.filter-select:focus,
.filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.search-group {
    grid-column: span 2;
}

/* Stats */
.art-stats {
    display: flex;
    gap: var(--space-lg);
    margin-bottom: var(--space-lg);
    padding: var(--space-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-5);
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
}

.stat-item strong {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
}

/* Art Grid */
.art-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space-lg);
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
    background: var(--color-primary);
    color: var(--color-primary-text);
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
    padding: var(--space-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    color: var(--color-text-secondary);
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
