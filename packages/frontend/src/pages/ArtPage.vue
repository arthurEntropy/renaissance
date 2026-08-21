<template>
    <div class="art-library">
        <ArtFilters v-model:gridSize="gridSize" v-model:typeFilters="typeFilters" v-model:sourceFilters="sourceFilters"
            v-model:groupBy="groupBy" v-model:orderBy="orderBy" v-model:showDuplicates="showDuplicates"
            :totalCount="filteredArt.length" :faceCount="faceCount" :placeCount="placeCount" :mapCount="mapCount"
            @add="handleOpenAddModal" />

        <ArtGrid :paginatedArt="paginatedArt" :groupedArt="groupedArt" :gridSize="gridSize"
            :selectedItems="selectedItems" @cardClick="handleCardClick" @add="handleOpenAddModal" />

        <!-- Hidden trigger for infinite scroll observer -->
        <div v-if="hasMore && !groupBy" ref="loadingIndicatorRef" style="height: 1px;"></div>

        <EditMultipleBar :selectedCount="selectedItems.length" @edit="openMultiEditModal"
            @delete-multiple="handleDeleteMultiple" @clear="clearSelection" />

        <EditArtModal v-if="showEditModal" :art="selectedArt" :hasPrevious="hasPreviousArt" :hasNext="hasNextArt"
            :isMultiEdit="isMultiEdit" :multiEditData="multiEditData" @close="closeEditModal" @save="handleSave"
            @delete="handleDelete" @navigate="navigateArt" />
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useInfiniteScrollObserver } from '@/composables/useInfiniteScrollObserver'
import { useArtFilters } from '@/components/features/artLibrary/composables/useArtFilters'
import { useArtModal } from '@/components/features/artLibrary/composables/useArtModal'
import { useArtMultiSelect } from '@/components/features/artLibrary/composables/useArtMultiSelect'
import { useArtNavigation } from '@/components/features/artLibrary/composables/useArtNavigation'
import { useArtMultiEdit } from '@/components/features/artLibrary/composables/useArtMultiEdit'
import { useArtCrud } from '@/components/features/artLibrary/composables/useArtCrud'
import { useConfirm } from '@/composables/useConfirm'
import ArtFilters from '@/components/features/artLibrary/components/ArtFilters.vue'
import ArtGrid from '@/components/features/artLibrary/components/ArtGrid.vue'
import EditMultipleBar from '@/components/features/artLibrary/components/EditMultipleBar.vue'
import EditArtModal from '@/components/editModals/EditArtModal.vue'

// Stores
const artStore = useArtStore()
const sourcesStore = useSourcesStore()

// Composables
const {
    gridSize,
    typeFilters,
    sourceFilters,
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
const { observerRef: loadingIndicatorRef, setup: setupIntersectionObserver } = useInfiniteScrollObserver(
    loadMore,
    hasMore,
    groupBy
)

// Multi-select behavior
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

// When we create a new art item, it should be given the type and tags to match the current filters
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

const handleDeleteMultiple = async () => {
    const { confirm } = useConfirm()
    if (!await confirm(`Delete ${selectedItems.value.length} selected item${selectedItems.value.length !== 1 ? 's' : ''}? This cannot be undone.`)) return
    try {
        await Promise.all(selectedItems.value.map(id => {
            const art = artStore.getById(id)
            return art ? artStore.remove(art) : Promise.resolve()
        }))
        clearSelection()
    } catch (error) {
        console.error('Error deleting multiple art items:', error)
        alert('Failed to delete some items. Please try again.')
    }
}

// Lifecycle
onMounted(async () => {
    await Promise.all([
        artStore.fetch(),
        sourcesStore.fetchSources()
    ])
    setupIntersectionObserver()
})
</script>

<style scoped>
.art-library {
    width: 90%;
    max-width: 1460px;
    margin: 0 auto;
    padding: 0;
}
</style>
