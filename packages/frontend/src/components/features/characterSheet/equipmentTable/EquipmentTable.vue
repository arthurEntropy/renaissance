<template>
  <CharacterSheetSection max-width="375px">
    <TableHeader title="Equipment" :is-edit-mode="internalEditMode" :show-edit-button="canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <EquipmentWeight :equipment-rows="characterEquipmentRows" />
      </template>
    </TableHeader>

    <!-- Draggable Item Rows -->
    <draggable v-model="sortedEquipmentRows" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-equipment-row" animation="150" :disabled="!internalEditMode" class="equipment-list">
      <template #item="{ element: row, index }">
        <div class="equipment-row">

          <FloatingEditControls v-if="internalEditMode" :index="index" delete-title="Remove item"
            drag-title="Drag to reorder" @delete="removeEquipmentItem" />

          <div class="equipment-card-col">
            <EquipmentCard v-if="row.equipment" :equipment="row.equipment" :collapsed="row.collapsed || false"
              @update:collapsed="updateEquipmentCollapsed(row, $event)" :art-expanded="row.artExpanded || false"
              @update:art-expanded="updateEquipmentArtExpanded(row, $event)" :editable="row.equipment.isCustom"
              class="equipment-card" @edit="editCustomItem" :collapsible="true" :show-keeping-badge="false"
              :show-add-to-character="false" />

            <span v-else class="missing-equipment">Unknown item</span>

            <EquipmentDetails :equipment-row="row" :index="index" :is-edit-mode="canEdit"
              @update-carried="handleCarriedChange" @update-wielding="handleWieldingChange"
              @update-quantity="handleQuantityChange" />

          </div>
        </div>
      </template>
    </draggable>

    <!-- Add Item FAB (only in edit mode) -->
    <AddButton :show="showAddButton" @click="showEquipmentSelector = true" title="Add item" />

    <!-- Equipment Selector Modal -->
    <ItemSelector :show="showEquipmentSelector" title="Add Equipment" :grouped-items="groupedEquipment"
      :search-query="equipmentSearchQuery" search-placeholder="Search equipment..."
      no-items-message="No equipment found" :get-source-name="sourceUtils.getSourceName"
      :show-choice-mode="showChoiceMode" :choice-options="equipmentChoiceOptions" @close="closeEquipmentSelector"
      @select="selectEquipment" @search="handleEquipmentSearch" @choice="handleEquipmentChoice">
      <template #item-display="{ item }">
        {{ item.name }}
        <span class="equipment-weight">({{ item.weight }} lbs)</span>
      </template>
    </ItemSelector>

  </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import EquipmentWeight from './EquipmentWeight.vue'
import EquipmentDetails from './EquipmentDetails.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingEditControls from '@/components/ui/controls/FloatingEditControls.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import AddButton from '@/components/ui/buttons/AddButton.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import draggable from 'vuedraggable'
import { useSimpleEditMode } from '@/composables/useEditMode'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useCharacterEquipment } from '@/composables/useCharacterEquipment'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import EquipmentService from '@/services/entities/equipment/equipmentService'
import * as CharacterUtils from '@shared/types/entities/characterUtils'
import { BookOpenIcon, PlusIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  equipment: Array,
  allEquipment: Array,
  character: Object,
  isEditMode: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['edit-custom-equipment'])

// Stores
const charactersStore = useCharactersStore()
const selectedCharacter = charactersStore.selectedCharacter
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentStore = useEquipmentStore()

// Internal edit mode management
const { isEditMode: internalEditMode, toggleEditMode } = useSimpleEditMode()

// canEdit is true if the parent allows editing (character sheet edit mode)
const canEdit = computed(() => props.isEditMode)

// FAB visibility - only show in edit mode
const showAddButton = computed(() => internalEditMode.value)

// Source management
const sourcesStore = useSourcesStore()

// Equipment selector state
const showEquipmentSelector = ref(false)
const showChoiceMode = ref(true)

// Equipment choice options
const equipmentChoiceOptions = [
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

// Equipment grouping and filtering
const { groupedItems: groupedEquipment, filterItems: filterEquipment, searchQuery: equipmentSearchQuery } = useItemSelector(
  computed(() => props.allEquipment || []),
  sourcesStore.sources,
  sourcesStore,
  { searchFields: ['name'] } // Only search equipment names
)

// Character equipment transformation
const { characterEquipmentRows } = useCharacterEquipment(
  computed(() => props.character.equipment),
  computed(() => props.allEquipment)
)
// Custom equipment creation
const isCreatingCustom = ref(false)

const createAndAddCustomEquipment = async () => {
  if (isCreatingCustom.value) return

  isCreatingCustom.value = true

  try {
    const createdEquipment = await EquipmentService.createCustomEquipment()

    const newItem = {
      id: createdEquipment.id,
      quantity: 1,
      isCarried: true,
      isWielding: false,
    }

    CharacterUtils.addSpecificEquipmentItem(selectedCharacter.value, newItem)

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

// Drag and drop - sorted equipment with reorder callback
const sortedEquipmentRows = computed({
  get: () => [...characterEquipmentRows.value].sort((a, b) => (a.index || 0) - (b.index || 0)),
  set: (newOrder) => {
    const updatedEquipment = newOrder.map((item, index) => ({
      ...item,
      index: index,
    }))

    const updated = CharacterService.reorderItems(selectedCharacter.value, 'equipment', updatedEquipment)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
})

// Methods
// Equipment Management

const removeEquipmentItem = (index) => {
  const equipmentRow = characterEquipmentRows.value[index]
  const equipmentName = equipmentRow?.equipment?.name || 'this item'

  if (confirm(`Are you sure you want to remove ${equipmentName}?`)) {
    const updated = CharacterService.removeItem(selectedCharacter.value, 'equipment', index)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
}

const handleCarriedChange = (index, isCarried) => {
  selectedCharacter.value.equipment[index].isCarried = isCarried

  if (!isCarried && selectedCharacter.value.equipment[index].isWielding) {
    selectedCharacter.value.equipment[index].isWielding = false
  }
}

const handleWieldingChange = (index, isWielding) => {
  const currentItem = selectedCharacter.value.equipment[index]
  const equipmentRow = characterEquipmentRows.value[index]

  let canWield = false
  if (currentItem.isCarried && equipmentRow.equipment) {
    const equipmentType = equipmentTypesStore.getById(equipmentRow.equipment.type)
    canWield = equipmentType?.name === 'Weapon'
  }

  selectedCharacter.value.equipment[index].isWielding = isWielding && canWield
}

const handleQuantityChange = (index, quantity) => {
  selectedCharacter.value.equipment[index].quantity = Math.max(1, quantity)
}

const editCustomItem = (equipment) => {
  emit('edit-custom-equipment', equipment)
}

// Equipment Selector
const selectEquipment = (equipment) => {
  const newItem = {
    id: equipment.id,
    quantity: 1,
    isCarried: true,
    isWielding: false,
    collapsed: true,
    artExpanded: false,
  }

  CharacterUtils.addSpecificEquipmentItem(
    selectedCharacter.value,
    newItem,
    props.allEquipment,
  )
  showEquipmentSelector.value = false
}

const handleEquipmentSearch = (query) => {
  equipmentSearchQuery.value = query
  filterEquipment()
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

// Handle equipment collapsed state changes
const updateEquipmentCollapsed = (equipmentRow, collapsed) => {
  const index = selectedCharacter.value.equipment.findIndex(eq => eq.id === equipmentRow.id)
  if (index !== -1) {
    selectedCharacter.value.equipment[index].collapsed = collapsed
  }
}

// Handle equipment art expanded state changes
const updateEquipmentArtExpanded = (equipmentRow, artExpanded) => {
  const index = selectedCharacter.value.equipment.findIndex(eq => eq.id === equipmentRow.id)
  if (index !== -1) {
    selectedCharacter.value.equipment[index].artExpanded = artExpanded
  }
}


</script>

<style scoped>
.equipment-list {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.equipment-row {
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
}

.equipment-card-col {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.equipment-row .equipment-card {
  flex: 1 1 0%;
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
  padding: 7px;
  text-align: left;
  margin-bottom: 0;
  box-sizing: border-box;
}

.missing-equipment {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.equipment-weight {
  color: var(--color-gray-light);
  font-size: var(--font-size-14);
  margin-left: 5px;
}

.ghost-equipment-row {
  opacity: 0.5;
  background: var(--overlay-white-subtle);
  border: 2px dashed var(--color-gray-light);
  border-radius: var(--radius-5);
}
</style>
