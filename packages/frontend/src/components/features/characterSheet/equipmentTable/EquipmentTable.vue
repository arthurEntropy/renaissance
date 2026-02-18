<template>
  <CharacterSheetSection>
    <TableHeader title="Equipment" :is-edit-mode="internalEditMode" :show-edit-button="canEdit" collapsible
      :is-collapsed="isCollapsed" @toggle-collapse="isCollapsed = !isCollapsed" @toggle-edit="toggleEditMode">
      <template #header-left>
        <FloatingActionButton v-if="internalEditMode" type="add" size="small" visibility="always"
          @click="showEquipmentSelector = true" />
      </template>
      <template #header-center>
        <div v-show="!isCollapsed && internalEditMode" class="header-controls">
          <SortingDropdown v-model="groupingOption" :options="groupingOptions" placeholder="Group by..." />
          <SortingDropdown v-model="equipmentSortOption" :options="sortOptions" placeholder="Order by..." />
        </div>
      </template>
      <template #header-right>
        <EquipmentWeight :equipment-items="characterEquipment" />
      </template>
    </TableHeader>

    <div v-if="!isCollapsed" class="equipment-content">
      <!-- Empty State: No Equipment -->
      <div v-if="characterEquipment.length === 0" class="empty-table-state">
        <p class="empty-table-message">No equipment</p>
        <p v-if="internalEditMode" class="empty-table-hint">Click the + button above to add your first equipment</p>
      </div>

      <!-- Grouped Display -->
      <GroupedMasonryGrid v-else-if="hasEquipmentGrouping" :column-width="350" :gap="20" :row-height="10"
        :grouped-items="groupedEquipmentItems" class="equipment-masonry" ref="masonryGridRef">
        <template #default="{ item }">
          <EquipmentCard v-if="item.equipment" :equipment="item.equipment" :collapsed="item.collapsed || false"
            :editable="item.equipment.isCustom" class="equipment-card" @edit="openEditEquipmentModal"
            @update="handleCharacterUpdate" :collapsible="false" :show-keeping-badge="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="item.showImprovements"
            @update:showImprovements="updateEquipmentShowImprovements(item, $event)" :engagement-success-options="[]" />
          <span v-else class="missing-item">Unknown item</span>

          <EquipmentDetails v-if="item.equipment" :equipment-item="item" :item-id="item.id" :is-edit-mode="canEdit"
            @update-carried="handleCarriedChange" @update-wielding="handleWieldingChange"
            @update-quantity="handleQuantityChange" />
        </template>
      </GroupedMasonryGrid>

      <!-- Ungrouped Display -->
      <MasonryGrid v-else :column-width="350" :gap="20" :row-height="10" class="equipment-masonry" ref="masonryGridRef">
        <div v-for="item in characterEquipment" :key="item.id" class="masonry-item">
          <EquipmentCard v-if="item.equipment" :equipment="item.equipment" :collapsed="item.collapsed || false"
            :editable="item.equipment.isCustom" class="equipment-card" @edit="openEditEquipmentModal"
            @update="handleCharacterUpdate" :collapsible="false" :show-keeping-badge="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="item.showImprovements"
            @update:showImprovements="updateEquipmentShowImprovements(item, $event)" :engagement-success-options="[]" />
          <span v-else class="missing-item">Unknown item</span>

          <EquipmentDetails v-if="item.equipment" :equipment-item="item" :item-id="item.id" :is-edit-mode="canEdit"
            @update-carried="handleCarriedChange" @update-wielding="handleWieldingChange"
            @update-quantity="handleQuantityChange" />
        </div>
      </MasonryGrid>
    </div>

    <!-- Equipment Selector Modal -->
    <ItemSelector :show="showEquipmentSelector" title="Add Equipment" :grouped-items="groupedEquipmentForSelector"
      :search-query="equipmentSearchQuery" search-placeholder="Search equipment..."
      no-items-message="No equipment found" :get-source-name="sourcesStore.getSourceName"
      :show-choice-mode="showChoiceMode" :choice-options="addEquipmentOptions" @close="closeEquipmentSelector"
      @select="selectEquipment" @search="equipmentSearchQuery = $event" @choice="handleEquipmentChoice">
      <template #item-display="{ item }">
        {{ item.name }}
        <span class="equipment-weight">({{ item.weight }} lbs)</span>
      </template>
    </ItemSelector>

    <!-- Edit Equipment Modal -->
    <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="allEquipment"
      :keeping-options="keepingStore.keeping" :sources="sourcesStore.sources"
      :equipment-types="equipmentTypesStore.items" :equipment-subtypes="equipmentSubtypesStore.items"
      :equipment-grades="equipmentGradesStore.items" :engagement-success-options="engagementSuccessOptions"
      @update="saveEditedEquipment" @close="closeEditEquipmentModal" @delete="deleteEquipment" />

  </CharacterSheetSection>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EquipmentWeight from './EquipmentWeight.vue'
import EquipmentDetails from './EquipmentDetails.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import SortingDropdown from '@/components/ui/dropdowns/SortingDropdown.vue'
import { useEditModal } from '@/composables/useEditModal'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useItemGrouping } from '@/composables/useItemGrouping'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS } from '@/constants/sortOptions'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import { BookOpenIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit-custom-equipment'])

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentStore = useEquipmentStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const keepingStore = useKeepingStore()
const sourcesStore = useSourcesStore()

const allEquipment = computed(() => equipmentStore.equipment || [])
const engagementSuccessOptions = ref([])

const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

const internalEditMode = ref(false)
const isCollapsed = ref(false)

const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const masonryGridRef = ref(null)

const sortOptions = EQUIPMENT_SORT_OPTIONS

const groupingOptions = [
  { value: 'source', label: 'Source' }
]

// Grouping and Sorting state
const groupingOption = computed({
  get: () => selectedCharacter.value?.groupEquipmentBySource ? 'source' : '',
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.groupEquipmentBySource = (value === 'source')
    }
  }
})

const equipmentSortOption = computed({
  get: () => selectedCharacter.value?.equipmentSortOption || 'name-asc',
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.equipmentSortOption = value
    }
  }
})

const canEdit = computed(() => props.isEditMode)

const showEquipmentSelector = ref(false)
const showChoiceMode = ref(true)

const addEquipmentOptions = [
  {
    key: 'library',
    label: 'Add from Library',
    icon: BookOpenIcon
  },
  {
    key: 'custom',
    label: 'Add Custom Item',
    icon: PlusIcon
  }
]

const { groupedItems: groupedEquipmentForSelector, searchQuery: equipmentSearchQuery } = useItemSelector(
  allEquipment,
  sourcesStore,
  { searchFields: ['name'] }
)

const characterEquipment = computed(() => {
  if (!selectedCharacter.value?.equipment) return []

  const equipment = selectedCharacter.value.equipment.map((entry) => {
    const equipment = allEquipment.value.find((eq) => eq.id === entry.id)
    return {
      ...entry,
      equipment,
      collapsed: entry.collapsed ?? true,
      showImprovements: entry.showImprovements ?? false,
    }
  })

  return sortItems(
    equipment.map(item => ({ ...item, ...item.equipment })),
    equipmentSortOption.value
  ).map(sorted => {
    const original = equipment.find(e => e.id === sorted.id)
    return {
      id: sorted.id,
      quantity: original.quantity,
      isCarried: original.isCarried,
      isWielding: original.isWielding,
      collapsed: original.collapsed,
      showImprovements: original.showImprovements,
      source: sorted.source,
      equipment: sorted.equipment
    }
  })
})

const { groupedItems: groupedEquipmentItems, hasGrouping: hasEquipmentGrouping } = useItemGrouping(
  characterEquipment,
  computed(() => !!selectedCharacter.value?.groupEquipmentBySource),
  sourcesStore
)

watch(characterEquipment, () => {
  masonryGridRef.value?.updateLayout()
}, { deep: true })

watch(isCollapsed, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      masonryGridRef.value?.updateLayout()
    })
  }
})

const isCreatingCustom = ref(false)

const createAndAddCustomEquipment = async () => {
  if (isCreatingCustom.value) return

  isCreatingCustom.value = true

  try {
    const createdEquipment = await equipmentStore.createCustomEquipment()

    const newItem = {
      id: createdEquipment.id,
      quantity: 1,
      isCarried: true,
      isWielding: false,
    }

    const updated = CharacterService.addItem(selectedCharacter.value, 'equipment', newItem)
    if (updated) Object.assign(selectedCharacter.value, updated)

    await equipmentStore.fetch()

    const fullEquipment = (equipmentStore.equipment || []).find(
      (eq) => eq.id === createdEquipment.id
    )

    if (fullEquipment) {
      emit('edit-custom-equipment', fullEquipment)
    } else {
      emit('edit-custom-equipment', createdEquipment.id)
    }
  } catch (error) {
    console.error('Error adding custom equipment:', error)
  } finally {
    isCreatingCustom.value = false
  }
}

const getEquipmentIndex = (itemId) => {
  if (!selectedCharacter.value?.equipment) return -1
  return selectedCharacter.value.equipment.findIndex(e => e.id === itemId)
}

const handleCarriedChange = (itemId, isCarried) => {
  const index = getEquipmentIndex(itemId)
  if (index === -1) return

  selectedCharacter.value.equipment[index].isCarried = isCarried

  if (!isCarried && selectedCharacter.value.equipment[index].isWielding) {
    selectedCharacter.value.equipment[index].isWielding = false
  }
}

const handleWieldingChange = (itemId, isWielding) => {
  const index = getEquipmentIndex(itemId)
  if (index === -1) return

  const currentItem = selectedCharacter.value.equipment[index]
  selectedCharacter.value.equipment[index].isWielding = isWielding && currentItem.isCarried
}

const handleQuantityChange = (itemId, quantity) => {
  const index = getEquipmentIndex(itemId)
  if (index === -1) return

  selectedCharacter.value.equipment[index].quantity = Math.max(1, quantity)
}

const handleCharacterUpdate = (updatedCharacter) => {
  if (updatedCharacter && selectedCharacter.value) {
    Object.assign(selectedCharacter.value, updatedCharacter)
  }
}

const updateEquipmentShowImprovements = (item, showImprovements) => {
  if (!selectedCharacter.value?.equipment) return
  const index = selectedCharacter.value.equipment.findIndex(e => e.id === item.id)
  if (index !== -1) {
    selectedCharacter.value.equipment[index].showImprovements = showImprovements
  }
}

const saveEditedEquipment = async (updatedEquipment) => {
  await equipmentStore.update(updatedEquipment)
  closeEditEquipmentModal()
}

const deleteEquipment = async (equipment) => {
  await equipmentStore.remove(equipment)
  closeEditEquipmentModal()
}

const selectEquipment = (equipment) => {
  const newItem = {
    id: equipment.id,
    quantity: 1,
    isCarried: true,
    isWielding: false,
    collapsed: false,
  }

  const updated = CharacterService.addItem(selectedCharacter.value, 'equipment', newItem)
  if (updated) Object.assign(selectedCharacter.value, updated)
  showEquipmentSelector.value = false
}

const handleEquipmentChoice = (choice) => {
  if (choice === 'library') {
    showChoiceMode.value = false
  } else if (choice === 'custom') {
    showEquipmentSelector.value = false
    showChoiceMode.value = true
    createAndAddCustomEquipment()
  }
}

const closeEquipmentSelector = () => {
  showEquipmentSelector.value = false
  showChoiceMode.value = true
}

onMounted(async () => {
  try {
    await keepingStore.fetch()
    await Promise.all([
      equipmentTypesStore.fetch(),
      equipmentSubtypesStore.fetch(),
      equipmentGradesStore.fetch()
    ])
    engagementSuccessOptions.value = await EngagementSuccessService.getAll()
    masonryGridRef.value?.updateLayout()
  } catch (error) {
    console.error('Error initializing EquipmentTable data:', error)
  }
})
</script>

<style scoped>
.missing-item {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.empty-table-state {
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-4);
  margin: var(--space-lg) 0;
}

.empty-table-message {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-table-hint {
  font-size: var(--font-size-14);
  color: var(--color-text-tertiary);
  margin: 0;
}

.add-button-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.equipment-content {
  width: 100%;
  min-width: 0;
}

.equipment-card {
  position: relative;
  z-index: 1;
}

.masonry-item {
  position: relative;
}
</style>
