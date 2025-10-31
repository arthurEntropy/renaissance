<template>
  <ItemCardsLayout itemType="Equipment" itemTypePlural="Equipment" :sources="sources" :items="paginatedEquipment"
    :sortOptions="sortOptions" v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter"
    v-model:sortOption="sortOption" :hasMore="hasMore" @create="createEquipment" @loadMore="loadMore" ref="layoutRef">

    <!-- Additional filters slot for equipment categories -->
    <template #additional-filters>
      <!-- Type Filter -->
      <select v-model="typeFilter" class="category-filter">
        <option value="">All Types</option>
        <option v-for="type in equipmentCategoriesStore.equipmentTypes" :key="type.id" :value="type.id">
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
        <option v-for="grade in equipmentCategoriesStore.equipmentGrades" :key="grade.id" :value="grade.id">
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
      <EquipmentCard v-for="item in filteredEquipment" :key="item.id" :equipment="item" :editable="isAdmin"
        :sources="sources" :art-expanded="true" @edit="openEditEquipmentModal(item)"
        @duplicate="handleDuplicateEquipment" @send-to-chat="sendEquipmentToChat(item)"
        @height-changed="layoutRef?.onCardHeightChanged()" :collapsible="false" :showSource="true" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="equipment"
        :keeping-options="equipmentStore.keeping" :sources="sources"
        :equipment-types="equipmentCategoriesStore.equipmentTypes"
        :equipment-subtypes="equipmentCategoriesStore.equipmentSubtypes"
        :equipment-grades="equipmentCategoriesStore.equipmentGrades"
        :equipment-ranges="equipmentCategoriesStore.equipmentRanges"
        :engagement-success-options="engagementSuccessOptions" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
    </template>
  </ItemCardsLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentCategoriesStore } from '@/stores/equipmentCategoriesStore'
import { useAuthStore } from '@/stores/authStore'
import { useEditModal } from '@/composables/useEditModal'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import EquipmentService from '@/services/equipmentService'
import EngagementSuccessService from '@/services/engagementSuccessService'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

// Store
const equipmentStore = useEquipmentStore()
const equipmentCategoriesStore = useEquipmentCategoriesStore()
const authStore = useAuthStore()
const { equipment } = storeToRefs(equipmentStore)

// Check if user is admin
const isAdmin = computed(() => authStore.isAdmin)

// Modal management
const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

// Sources management
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources

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
const filteredSubtypes = computed(() => {
  if (!typeFilter.value) {
    return equipmentCategoriesStore.equipmentSubtypes
  }
  return equipmentCategoriesStore.getSubtypesByType(typeFilter.value)
})

// Computed property for filtered equipment (before pagination)
const allFilteredEquipment = computed(() => {
  let filtered = [...equipment.value].filter(item => !item.isDeleted)

  // Exclude templates unless showTemplates is true (for admins)
  if (!showTemplates.value) {
    filtered = filtered.filter(item => !item.isTemplate)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(item => {
      const name = (item.name || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // Apply source filter
  if (sourceFilter.value) {
    filtered = filtered.filter(item => item.source === sourceFilter.value)
  }

  // Apply type filter
  if (typeFilter.value) {
    filtered = filtered.filter(item => item.type === typeFilter.value)
  }

  // Apply subtype filter
  if (subtypeFilter.value) {
    filtered = filtered.filter(item => item.subtype === subtypeFilter.value)
  }

  // Apply grade filter
  if (gradeFilter.value) {
    filtered = filtered.filter(item => item.grade === gradeFilter.value)
  }

  // Apply sorting
  if (sortOption.value) {
    const [field, direction] = sortOption.value.split('-')
    filtered.sort((a, b) => {
      const aValue = a?.[field]
      const bValue = b?.[field]

      // Handle null/undefined values
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

// Convert to ref for infinite scroll
const allFilteredEquipmentRef = computed(() => allFilteredEquipment.value)

// Infinite scroll setup with filtered equipment
const { paginatedItems: paginatedEquipment, loadMore, hasMore, reset } = useInfiniteScroll(allFilteredEquipmentRef, 50)

// Custom filtering that includes category filters - now uses paginated equipment
const filteredEquipment = computed(() => {
  // Since allFilteredEquipment already applies all filters,
  // and paginatedEquipment is a subset of it,
  // we just return the paginated items directly
  return paginatedEquipment.value
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

// EQUIPMENT CRUD
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

// OTHER METHODS
const sendEquipmentToChat = (_equipment) => {
  // Placeholder for future chat integration
}

const handleDuplicateEquipment = async () => {
  try {
    // Refresh the equipment list to include the new duplicate
    await equipmentStore.fetch()

    // Trigger layout update for masonry
    layoutRef?.value?.onCardHeightChanged()

    console.log('Equipment duplicated and list refreshed')
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

// Watchers
watch(typeFilter, () => {
  // Clear subtype filter when type changes
  subtypeFilter.value = ''
  // Reset pagination when filters change
  reset()
})

watch([searchQuery, sourceFilter, subtypeFilter, gradeFilter, sortOption, showTemplates], () => {
  // Reset pagination when any filter changes
  reset()
})

// Lifecycle
onMounted(async () => {
  try {
    // Sources will auto-fetch via useSources composable
    await equipmentStore.fetchKeeping()
    await equipmentCategoriesStore.fetchAll()
    await fetchEngagementSuccessOptions()
    await equipmentStore.fetch()
  } catch (error) {
    console.error('Error initializing EquipmentPage:', error)
  }
})
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
