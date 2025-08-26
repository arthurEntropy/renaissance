<template>
  <CharacterSheetSection max-width="375px">
    <TableHeader title="Equipment" :is-edit-mode="isEditMode" @toggle-edit="toggleEditMode">
      <template #header-right>
        <EquipmentWeight :equipment-rows="characterEquipmentRows" />
      </template>
    </TableHeader>

    <!-- Draggable Item Rows -->
    <draggable v-model="sortedEquipmentRows" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-equipment-row" animation="150" :disabled="!isEditMode" class="equipment-list">
      <template #item="{ element: row, index }">
        <div class="equipment-row">

          <FloatingEditControls v-if="isEditMode" :index="index" delete-title="Remove item" drag-title="Drag to reorder"
            @delete="removeEquipmentItem" />

          <div class="equipment-card-col">
            <EquipmentCard v-if="row.equipment" :equipment="row.equipment" :collapsed="getCollapsedState(row.equipment)"
              @update:collapsed="setCollapsedState(row.equipment, $event)" :editable="row.equipment.isCustom"
              class="equipment-card" @edit="editCustomItem" :collapsible="true" :show-keeping-badge="false" />

            <span v-else class="missing-equipment">Unknown item</span>

            <EquipmentDetails :equipment-row="row" :index="index" @update-carried="handleCarriedChange"
              @update-wielding="handleWieldingChange" @update-quantity="handleQuantityChange" />

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
import CharacterService from '@/services/characterService'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import EquipmentWeight from './EquipmentWeight.vue'
import EquipmentDetails from './EquipmentDetails.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingEditControls from '@/components/ui/controls/FloatingEditControls.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import AddButton from '@/components/ui/buttons/AddButton.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import draggable from 'vuedraggable'
import { useTableEditMode } from '@/composables/useTableEditMode'
import { useItemManagement } from '@/composables/useItemManagement'
import { useCollapseState } from '@/composables/useCollapseState'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useItemSelector } from '@/composables/useItemSelector'
import { useSourceUtils } from '@/composables/useSourceUtils'
import { useCharacterEquipment } from '@/composables/useCharacterEquipment'
import { useCustomEquipment } from '@/composables/useCustomEquipment'
import { BookOpenIcon, PlusIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  equipment: Array,
  allEquipment: Array,
  character: Object
})

// Emits
const emit = defineEmits(['update-character', 'edit-custom-equipment'])

// Composables
const { isEditMode, toggleEditMode, showAddButton } = useTableEditMode()

// Item management for equipment
const equipmentManagement = useItemManagement(
  computed(() => props.character),
  emit,
  'equipment',
  'item'
)

const { getCollapsedState, setCollapsedState } = useCollapseState(true)

// Source management
const { sources, sourceUtils } = useSourceUtils()

// Equipment selector state
const showEquipmentSelector = ref(false)
const showChoiceMode = ref(true)
const equipmentSearchQuery = ref('')

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
const { groupedItems: groupedEquipment, filterItems: filterEquipment } = useItemSelector(
  computed(() => props.allEquipment || []),
  sources,
  sourceUtils,
  { searchFields: ['name'] } // Only search equipment names
)

// Character equipment transformation
const { characterEquipmentRows } = useCharacterEquipment(
  computed(() => props.character.equipment),
  computed(() => props.allEquipment)
)

// Custom equipment creation
const { createAndAddCustomEquipment } = useCustomEquipment(
  computed(() => props.character),
  emit
)

// Drag and drop functionality
const updateEquipmentOrder = (newOrder) => {
  const updatedEquipment = newOrder.map((item, index) => ({
    ...item,
    index: index,
  }))

  equipmentManagement.reorderItems(updatedEquipment)
}

const {
  sortedItems: sortedEquipmentRows,
  onDragEnd
} = useDragAndDrop(characterEquipmentRows, updateEquipmentOrder, 'index')

// Methods
// Equipment Management

const removeEquipmentItem = (index) => {
  equipmentManagement.removeItem(index, {
    getDisplayName: (equipmentRow) => {
      const equipment = equipmentRow?.equipment
      return equipment ? equipment.name : 'this item'
    },
    confirmMessage: (name) => `Are you sure you want to remove ${name} from inventory?`
  })
}

const handleCarriedChange = (index, isCarried) => {
  const updates = { isCarried: isCarried }

  if (!isCarried) {
    const currentItem = props.character.equipment[index]
    if (currentItem.isWielding) {
      updates.isWielding = false
    }
  }

  equipmentManagement.updateItem(index, updates)
}

const handleWieldingChange = (index, isWielding) => {
  const currentItem = props.character.equipment[index]
  const equipmentRow = characterEquipmentRows.value[index]

  const canWield = currentItem.isCarried &&
    equipmentRow.equipment &&
    equipmentRow.equipment.isMelee

  const shouldWield = isWielding && canWield
  equipmentManagement.updateItem(index, { isWielding: shouldWield })
}

const handleQuantityChange = (index, quantity) => {
  const validQuantity = Math.max(1, quantity)
  equipmentManagement.updateItem(index, { quantity: validQuantity })
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
  }

  CharacterService.addSpecificEquipmentItem(
    props.character,
    newItem,
    props.allEquipment,
  )
  emit('update-character', props.character)
  showEquipmentSelector.value = false
}

const handleEquipmentSearch = (query) => {
  equipmentSearchQuery.value = query
  filterEquipment(query)
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
