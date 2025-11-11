<template>
    <div class="art-library">
        <ArtFilters v-model:gridSize="gridSize" v-model:typeFilters="typeFilters" v-model:sourceFilters="sourceFilters"
            v-model:sourceFilter="sourceFilter" v-model:groupBy="groupBy" v-model:orderBy="orderBy"
            v-model:showDuplicates="showDuplicates" :totalCount="filteredArt.length" :faceCount="faceCount"
            :placeCount="placeCount" :mapCount="mapCount" @add="handleOpenAddModal" />

        <ArtGrid :paginatedArt="paginatedArt" :groupedArt="groupedArt" :gridSize="gridSize"
            :selectedItems="selectedItems" @cardClick="handleCardClick" @add="handleOpenAddModal" />

        <!-- Loading indicator for infinite scroll (only when not grouping) -->
        <div v-if="hasMore && !groupBy" class="loading-indicator" ref="loadingIndicatorRef">
            <span class="loading-text">Loading more art...</span>
        </div>

        <EditMultipleBar :selectedCount="selectedItems.length" @edit="openMultiEditModal" />

        <!-- Edit Modal -->
        <EditArtModal v-if="showEditModal" :art="selectedArt" :hasPrevious="hasPreviousArt" :hasNext="hasNextArt"
            :isMultiEdit="isMultiEdit" :multiEditData="multiEditData" @close="closeEditModal" @save="handleSave"
            @delete="handleDelete" @navigate="navigateArt" />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useArtFilters } from './composables/useArtFilters'
import { useArtModal } from './composables/useArtModal'
import { useArtMultiSelect } from './composables/useArtMultiSelect'
import { useArtNavigation } from './composables/useArtNavigation'
import { useArtMultiEdit } from './composables/useArtMultiEdit'
import { useArtCrud } from './composables/useArtCrud'
import ArtFilters from './components/ArtFilters.vue'
import ArtGrid from './components/ArtGrid.vue'
import EditMultipleBar from './components/EditMultipleBar.vue'
import EditArtModal from '@/components/editModals/EditArtModal.vue'

// Stores
const artStore = useArtStore()
const sourcesStore = useSourcesStore()

// Composables
const {
    gridSize,
    typeFilters,
    sourceFilters,
    sourceFilter,
    groupBy,
    orderBy,
    showDuplicates,
    filteredArt,
    groupedArt,
    faceCount,
    placeCount,
    mapCount,
} = useArtFilters(artStore)

const {
    showEditModal,
    selectedArt,
    isMultiEdit,
    openAddModal,
    openEditModal,
    openMultiEditModal,
    closeEditModal,
} = useArtModal()

const {
    selectedItems,
    toggleSelection,
    clearSelection,
} = useArtMultiSelect()

const {
    hasPreviousArt,
    hasNextArt,
    navigateArt,
} = useArtNavigation(selectedArt, filteredArt)

const {
    multiEditData,
} = useArtMultiEdit(artStore, selectedItems, isMultiEdit)

const {
    saveArt,
    deleteArt,
} = useArtCrud(artStore)

// Infinite scroll
const { paginatedItems: paginatedArt, loadMore, hasMore } = useInfiniteScroll(filteredArt, 50)
const loadingIndicatorRef = ref(null)
let intersectionObserver = null

// Card click handler
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

// Add modal handler with current filters
const handleOpenAddModal = () => {
    const initialTags = {}

    // If only one type filter is selected, use it as the default type
    if (typeFilters.value.length === 1) {
        initialTags.type = typeFilters.value[0]
    }

    // Apply all selected source filters
    if (sourceFilters.value.length > 0) {
        initialTags.sources = [...sourceFilters.value]
    }

    openAddModal(initialTags)
}

// CRUD handlers
const handleSave = async (artData) => {
    await saveArt(artData, selectedItems, closeEditModal, clearSelection)
}

const handleDelete = async (artData) => {
    await deleteArt(artData, closeEditModal)
}

// Setup intersection observer for infinite scroll
const setupIntersectionObserver = () => {
    // Don't setup observer if grouping is active
    if (groupBy.value) return

    if (!loadingIndicatorRef.value) return

    // Disconnect existing observer if any
    if (intersectionObserver) {
        intersectionObserver.disconnect()
    }

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

// Watch for changes in hasMore, filteredArt, and groupBy to reset the observer
watch([hasMore, () => filteredArt.value.length, groupBy], () => {
    // Disconnect observer if grouping is active
    if (groupBy.value && intersectionObserver) {
        intersectionObserver.disconnect()
        intersectionObserver = null
        return
    }

    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
        setupIntersectionObserver()
    }, 10)
})
</script>

<style scoped>
.art-library {
    max-width: 1400px;
    min-width: min(100%, 1200px);
    margin: 0 auto;
    padding: var(--space-xl);
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

/* Responsive */
@media (max-width: var(--breakpoint-md)) {
    .art-library {
        padding: var(--space-md);
    }
}
</style>
