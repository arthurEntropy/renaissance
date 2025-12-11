<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" ref="layoutRef">

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
    <template #item-cards>
      <EquipmentCard v-for="item in paginatedEquipment" :key="item.id" :equipment="item" :editable="isAdmin"
        :sources="sources" :art-expanded="true" @edit="openEditEquipmentModal(item)"
        @duplicate="handleDuplicateEquipment" @height-changed="layoutRef?.onCardHeightChanged()" :collapsible="false"
        :showSource="true" />
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
import { storeToRefs } from 'pinia'
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
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import EquipmentService from '@/services/entities/equipment/equipmentService'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
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

const { equipment } = storeToRefs(equipmentStore)

// Modal management
const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

// Reactive state
const layoutRef = ref(null)
const sortOption = ref('name-asc')
const searchQuery = ref('')
const sourceFilter = ref('')
const typeFilter = ref('')
const subtypeFilter = ref('')
const gradeFilter = ref('')
const showTemplates = ref(false)
const engagementSuccessOptions = ref([])

// Computed properties
const isAdmin = computed(() => authStore.isAdmin)
const sources = computed(() => sourcesStore.sources)

const filteredSubtypes = computed(() => {
  if (!typeFilter.value) {
    return equipmentSubtypesStore.items
  }
  return equipmentSubtypesStore.getSubtypesByType(typeFilter.value)
})

const sortOptions = ref({
  'Name': [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ],
  'Weight': [
    { value: 'weight-asc', label: 'Weight (Light to Heavy)' },
    { value: 'weight-desc', label: 'Weight (Heavy to Light)' },
  ],
  'Keeping': [
    { value: 'keeping-asc', label: 'Keeping (Low to High)' },
    { value: 'keeping-desc', label: 'Keeping (High to Low)' },
  ],
})

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

  if (sortOption.value) {
    const [field, direction] = sortOption.value.split('-')
    filtered.sort((a, b) => {
      const aValue = a?.[field]
      const bValue = b?.[field]

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      let comparison = 0
      if (field === 'name') {
        comparison = String(aValue).localeCompare(String(bValue))
      } else {
        comparison = Number(aValue) - Number(bValue)
      }

      return direction === 'asc' ? comparison : -comparison
    })
  }

  return filtered
})

// Infinite scroll setup
const { paginatedItems: paginatedEquipment, loadMore, hasMore, reset } = useInfiniteScroll(
  allFilteredEquipment,
  50
)

// Filter persistence
const { initialize: initializeFilterPersistence } = useFilterPersistence('equipment', {
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
  const newEquipment = await EquipmentService.create()
  await equipmentStore.fetch()
  const createdEquipment = equipmentStore.equipment.find(
    (item) => item.id === newEquipment.id,
  )
  openEditEquipmentModal(createdEquipment)
}

const saveEditedEquipment = async (editedEquipment) => {
  await EquipmentService.update(editedEquipment)
  closeEditEquipmentModal()
  await equipmentStore.fetch()
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
      await EquipmentService.update(equipmentToUpdate)
      await equipmentStore.fetch()
    } catch (error) {
      console.error('Error deleting equipment:', error)
    }
  }
}

const handleDuplicateEquipment = async () => {
  try {
    await equipmentStore.fetch()
    layoutRef?.value?.onCardHeightChanged()
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
    initializeFilterPersistence()
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

onMounted(() => {
  refreshData()
})

// Layout props for ItemCardsLayout
const layoutProps = computed(() => ({
  itemType: 'Equipment',
  itemTypePlural: 'Equipment',
  sources: sources.value,
  items: paginatedEquipment.value,
  sortOptions: sortOptions.value,
  hasMore: hasMore.value,
  onCreate: createEquipment,
  onLoadMore: loadMore
}))

const equipmentTypes = computed(() => equipmentTypesStore.items)
const equipmentSubtypes = computed(() => equipmentSubtypesStore.items)
const equipmentGrades = computed(() => equipmentGradesStore.items)
const equipmentRanges = computed(() => equipmentRangesStore.items)
const keeping = computed(() => keepingStore.keeping)
const allEquipment = equipment
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.category-filter {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  background-color: var(--overlay-black-medium);
  font-size: var(--font-size-16);
  color: var(--color-white);
  min-width: 120px;
}

.category-filter option {
  background-color: var(--overlay-black-heavy);
  padding: var(--space-sm);
}

.category-filter:focus {
  outline: none;
  border-color: var(--color-gray-light);
  box-shadow: var(--shadow-glow-sm);
}

.category-filter:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--overlay-black-heavy);
}

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
</style>
