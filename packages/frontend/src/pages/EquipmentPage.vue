<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" @create="createEquipment" @load-more="loadMore">

    <!-- Additional filters slot for equipment categories -->
    <template #additional-filters>
      <!-- Type Filter -->
      <select v-model="typeFilter" class="category-filter">
        <option value="">All Types</option>
        <option v-for="type in equipmentTypes" :key="type.id" :value="type.id">
          {{ type.name }}
        </option>
      </select>

      <!-- Subtype Filter -->
      <select v-model="subtypeFilter" class="category-filter" :disabled="!typeFilter">
        <option value="">All Subtypes</option>
        <option v-for="subtype in filteredSubtypes" :key="subtype.id" :value="subtype.id">
          {{ subtype.name }}
        </option>
      </select>

      <!-- Grade Filter -->
      <select v-model="gradeFilter" class="category-filter">
        <option value="">All Grades</option>
        <option v-for="grade in equipmentGrades" :key="grade.id" :value="grade.id">
          {{ grade.name }}
        </option>
      </select>

      <!-- Template Toggle (Admin Only) -->
      <label v-if="isAdmin" class="template-toggle">
        <input type="checkbox" v-model="showTemplates" />
        <span>Show Templates</span>
      </label>
    </template>

    <!-- Item cards slot -->
    <template #item-cards="{ items }">
      <EquipmentCard v-for="item in items" :key="item.id" :equipment="item" :editable="isAdmin" :duplicatable="isAdmin"
        :sources="sources" :art-expanded="true" :engagement-success-options="engagementSuccessOptions"
        :collapsible="false" @edit="openEditEquipmentModal(item)" @duplicate="handleDuplicateEquipment" />
    </template>

    <!-- Loading indicator slot with ref for intersection observer -->
    <template #loading-indicator="{ hasMore, isLoadingMore }">
      <div v-if="hasMore" class="loading-indicator" ref="loadingIndicatorRef">
        <span v-if="isLoadingMore" class="loading-text">Loading more items...</span>
      </div>
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="allEquipment"
        :keeping-options="keeping" :sources="sources" :equipment-types="equipmentTypes"
        :equipment-subtypes="equipmentSubtypes" :equipment-grades="equipmentGrades" :equipment-ranges="equipmentRanges"
        :engagement-success-options="engagementSuccessOptions" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
    </template>
  </ItemCardsLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useAuthStore } from '@/stores/authStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useEditModal } from '@/composables/useEditModal'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useInfiniteScrollObserver } from '@/composables/useInfiniteScrollObserver'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS } from '@/constants/sortOptions'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

// Stores
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const keepingStore = useKeepingStore()
const authStore = useAuthStore()
const sourcesStore = useSourcesStore()

const equipment = computed(() => equipmentStore.equipment)

// Modal management
const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

// Reactive state
const sortOption = ref('name-asc')
const searchQuery = ref('')
const sourceFilter = ref('')
const typeFilter = ref('')
const subtypeFilter = ref('')
const gradeFilter = ref('')
const showTemplates = ref(false)
const engagementSuccessOptions = ref([])
const isLoadingMore = ref(false)

// Computed properties
const isAdmin = computed(() => authStore.isAdmin)
const sources = computed(() => sourcesStore.sources)

const filteredSubtypes = computed(() => {
  if (!typeFilter.value) {
    return equipmentSubtypesStore.items
  }
  return equipmentSubtypesStore.getSubtypesByType(typeFilter.value)
})

const sortOptions = ref(EQUIPMENT_SORT_OPTIONS)

// Filtering and sorting logic
const allFilteredEquipment = computed(() => {
  let filtered = [...equipment.value].filter(item => !item.isDeleted)

  if (!showTemplates.value) {
    filtered = filtered.filter(item => !item.isTemplate)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(item => {
      const name = (item.name || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  if (sourceFilter.value) {
    filtered = filtered.filter(item => item.source === sourceFilter.value)
  }

  if (typeFilter.value) {
    filtered = filtered.filter(item => item.type === typeFilter.value)
  }

  if (subtypeFilter.value) {
    filtered = filtered.filter(item => item.subtype === subtypeFilter.value)
  }

  if (gradeFilter.value) {
    filtered = filtered.filter(item => item.grade === gradeFilter.value)
  }

  return sortItems(filtered, sortOption.value)
})

// Infinite scroll setup
const { paginatedItems: paginatedEquipment, loadMore: loadMoreItems, hasMore, reset } = useInfiniteScroll(
  allFilteredEquipment,
  50
)

const loadMore = async () => {
  isLoadingMore.value = true
  loadMoreItems()
  await new Promise(resolve => setTimeout(resolve, 100))
  isLoadingMore.value = false
}

// Filter persistence - auto-initializes
useFilterPersistence('equipment', {
  sortOption,
  searchQuery,
  sourceFilter,
  typeFilter,
  subtypeFilter,
  gradeFilter,
  showTemplates
})

// CRUD operations
const createEquipment = async () => {
  const newEquipment = await equipmentStore.create()
  const createdEquipment = equipmentStore.equipment.find(
    (item) => item.id === newEquipment.id,
  )
  openEditEquipmentModal(createdEquipment)
}

const saveEditedEquipment = async (editedEquipment) => {
  await equipmentStore.update(editedEquipment)
  closeEditEquipmentModal()
}

const deleteEquipment = async (equipmentItem) => {
  const deleteId = equipmentItem?.id
  const editId = equipmentToEdit.value?.id
  if (equipmentItem) {
    const equipmentToUpdate = { ...equipmentItem, isDeleted: true }
    try {
      if (showEditEquipmentModal.value && editId === deleteId) {
        closeEditEquipmentModal()
      }
      await equipmentStore.update(equipmentToUpdate)
    } catch (error) {
      console.error('Error deleting equipment:', error)
    }
  }
}

const handleDuplicateEquipment = async () => {
  try {
    await equipmentStore.fetch()
  } catch (error) {
    console.error('Error refreshing equipment list after duplication:', error)
  }
}

const fetchEngagementSuccessOptions = async () => {
  try {
    engagementSuccessOptions.value = await EngagementSuccessService.getAll()
  } catch (error) {
    console.error('Error fetching engagement success options:', error)
  }
}

// Data initialization
const refreshData = async () => {
  try {
    await sourcesStore.fetchSources()
    await keepingStore.fetch()
    await Promise.all([
      equipmentTypesStore.fetch(),
      equipmentSubtypesStore.fetch(),
      equipmentGradesStore.fetch(),
      equipmentRangesStore.fetch()
    ])
    await fetchEngagementSuccessOptions()
    await equipmentStore.fetch()
  } catch (error) {
    console.error('Error initializing EquipmentPage:', error)
  }
}

// Watchers
watch(typeFilter, () => {
  subtypeFilter.value = ''
  reset()
})

watch([searchQuery, sourceFilter, subtypeFilter, gradeFilter, sortOption, showTemplates], () => {
  reset()
})

// Setup infinite scroll observer
const { observerRef: loadingIndicatorRef, setup: setupObserver } = useInfiniteScrollObserver(
  loadMore,
  hasMore
)

onMounted(() => {
  refreshData()
  setupObserver()
})

// Layout props for ItemCardsLayout
const layoutProps = computed(() => ({
  items: paginatedEquipment.value,
  sortOptions: sortOptions.value,
  hasMore: hasMore.value,
  isLoadingMore: isLoadingMore.value,
}))

const equipmentTypes = computed(() => equipmentTypesStore.items)
const equipmentSubtypes = computed(() => equipmentSubtypesStore.items)
const equipmentGrades = computed(() => equipmentGradesStore.items)
const equipmentRanges = computed(() => equipmentRangesStore.items)
const keeping = computed(() => keepingStore.keeping)
const allEquipment = computed(() => equipmentStore.equipment)
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.template-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background-color: var(--overlay-black-medium);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  font-size: var(--font-size-16);
  color: var(--color-white);
  cursor: pointer;
  user-select: none;
}

.template-toggle:hover {
  border-color: var(--color-gray-light);
  box-shadow: var(--shadow-glow-sm);
}

.template-toggle input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.template-toggle span {
  white-space: nowrap;
}

.loading-indicator {
  padding: var(--space-lg);
  text-align: center;
  width: 100%;
}

.loading-text {
  color: var(--color-gray-light);
  font-size: var(--font-size-14);
  font-style: italic;
}
</style>
