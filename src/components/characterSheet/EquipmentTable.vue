<template>
  <div class="equipment-table">
    <!-- TITLE -->
    <div class="equipment-table-header edit-trigger">
      <div class="header-left">
        <h2>Equipment</h2>
        <EditButton size="small" visibility="on-hover" :is-edit-mode="isEditMode" @click="toggleEditMode" />
      </div>
      <div class="header-right">
        <div class="total-weight-container">
          <span class="total-weight-carried">Total Carried:</span>
          <span class="equipment-lbs-carried">{{ totalWeightCarried }} lbs</span>
        </div>
      </div>
    </div>

    <!-- DRAGGABLE ITEM ROWS -->
    <draggable v-model="sortedEquipmentRows" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-equipment-row" animation="150" :disabled="!isEditMode">
      <template #item="{ element: row, index }">
        <div class="equipment-row">
          <div class="equipment-row-flex">
            <!-- Floating Edit Controls (only in edit mode) -->
            <div v-if="isEditMode" class="floating-edit-controls">
              <button @click="removeEquipmentItem(index)" class="fab-delete" title="Remove item"
                type="button">ⓧ</button>
              <span class="fab-drag drag-handle" title="Drag to reorder">⋮⋮</span>
            </div>
            <!-- EquipmentCard (collapsed/minimal) -->
            <div class="equipment-card-col">
              <EquipmentCard v-if="row.equipment" :equipment="row.equipment"
                :collapsed="getCollapsedState(row.equipment)"
                @update:collapsed="setCollapsedState(row.equipment, $event)" :editable="row.equipment.isCustom"
                class="equipment-card" @edit="editCustomItem" :collapsible="true" :show-sol-badge="false" />
              <span v-else class="missing-equipment">Unknown item</span>
              <div class="equipment-row-details">
                <div class="details-content">
                  <!-- Carried Checkbox -->
                  <div class="detail-item checkbox-item">
                    <input type="checkbox" class="equipment-checkbox" v-model="row.isCarried"
                      @change="handleCarriedChange(index, row.isCarried)" />
                    <em class="carried-label">carried</em>
                  </div>
                  <!-- Wielding Checkbox (edit mode only) -->
                  <div class="detail-item checkbox-item">
                    <input type="checkbox" class="equipment-checkbox" :class="{
                      'disabled-checkbox':
                        !row.isCarried ||
                        !(row.equipment && row.equipment.isMelee),
                    }" v-model="row.isWielding" @change="
                      updateEquipmentItem(
                        index,
                        'isWielding',
                        row.isWielding &&
                        row.isCarried &&
                        row.equipment &&
                        row.equipment.isMelee,
                      )
                      " :disabled="!row.isCarried || !(row.equipment && row.equipment.isMelee)
                        " />
                    <em class="carried-label" :class="{
                      'disabled-text':
                        !row.isCarried ||
                        !(row.equipment && row.equipment.isMelee),
                    }">wielding</em>
                  </div>
                  <div class="detail-item">
                    <!-- Quantity -->
                    <div class="detail-item">
                      <em class="carried-label"> qty </em>
                      <NumberInput :model-value="row.quantity" @update:model-value="
                        (value) =>
                          updateEquipmentItem(
                            index,
                            'quantity',
                            Math.max(1, value),
                          )
                      " :min="1" size="tiny" class="quantity-input" />
                    </div>
                    <!-- Carried Weight -->
                    <div class="detail-item carried-weight">
                      <em class="carried-label"> = </em>
                      <span>
                        {{
                          row.isCarried && row.equipment
                            ? formatWeight(row.equipment.weight * row.quantity)
                            : '0'
                        }}
                      </span>
                      <em class="carried-label">lbs</em>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Add Item Floating Button (only visible in edit mode) -->
    <button v-if="isEditMode" class="add-equipment-fab" @click="toggleAddOptions($event)" title="Add item"
      type="button">
      +
    </button>

    <!-- Add Options Menu -->
    <div v-if="showAddOptions" class="add-options-menu">
      <div class="add-option" @click="showAddOptions = false; toggleEquipmentSelector($event)">
        <i>📖</i> Add from Library
      </div>
      <div class="add-option" @click="addCustomEquipment()">
        <i>➕</i> Add Custom Item
      </div>
    </div>

    <!-- Equipment Selector Dropdown -->
    <div v-if="showEquipmentSelector" class="equipment-selector-container">
      <div class="equipment-selector-header">
        <input type="text" v-model="equipmentSearchQuery" placeholder="Search equipment..." class="equipment-search"
          @input="filterEquipment" />
        <span @click="toggleEquipmentSelector()" class="close-selector">×</span>
      </div>
      <div class="equipment-options-container">
        <template v-for="(items, source) in groupedEquipment" :key="source">
          <div class="equipment-source-group">
            <div class="source-header">{{ sourceUtils.getSourceName(source) }}</div>
            <div v-for="item in items" :key="item.id" class="equipment-option" @click="selectEquipment(item)">
              {{ item.name }}
              <span class="equipment-weight">({{ item.weight }} lbs)</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import CharacterService from '@/services/CharacterService'
import EquipmentCard from '@/components/EquipmentCard.vue'
import EquipmentService from '@/services/EquipmentService'
import EditButton from '@/components/EditButton.vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import draggable from 'vuedraggable'
import NumberInput from '@/components/NumberInput.vue'
import { useSimpleEditMode } from '@/composables/useEditMode'
import { useCollapseState } from '@/composables/useCollapseState'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useItemSelector } from '@/composables/useItemSelector'
import { useSourcesStore } from '@/stores/sourcesStore'

// Props
const props = defineProps({
  equipment: Array,
  allEquipment: Array,
  character: Object
})

// Emits
const emit = defineEmits(['update-character', 'edit-custom-equipment'])

// Store
const equipmentStore = useEquipmentStore()

// Composables
const { isEditMode, toggleEditMode } = useSimpleEditMode()
const { getCollapsedState, setCollapsedState } = useCollapseState(true)

// Source management - using sources store
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources
const sourceUtils = {
  getSourceById: sourcesStore.getSourceById,
  getSourceName: sourcesStore.getSourceName,
  getSourceType: sourcesStore.getSourceType,
}

// Item selector for equipment
const {
  showSelector: showEquipmentSelector,
  searchQuery: equipmentSearchQuery,
  groupedItems: groupedEquipment,
  toggleSelector: toggleEquipmentSelector,
  filterItems: filterEquipment
} = useItemSelector(computed(() => props.allEquipment), sources, sourceUtils)

// Additional equipment-specific state
const showAddOptions = ref(false)

// Computed properties
const characterEquipmentRows = computed(() => {
  const allEquipment = props.allEquipment || [] // Fallback to an empty array
  return props.character.equipment.map((entry) => {
    const equipment = allEquipment.find((eq) => eq.id === entry.id)
    return {
      ...entry,
      equipment,
    }
  })
})

// Drag and drop functionality
const updateEquipmentOrder = (newOrder) => {
  // Update the index property on each equipment item
  const updatedEquipment = newOrder.map((item, index) => ({
    ...item,
    index: index,
  }))

  // Create a new character object with updated equipment
  const updatedCharacter = {
    ...props.character,
    equipment: updatedEquipment,
  }

  // Emit the update event with the new character object
  emit('update-character', updatedCharacter)
}

const {
  sortedItems: sortedEquipmentRows,
  onDragEnd
} = useDragAndDrop(characterEquipmentRows, updateEquipmentOrder, 'index')

const totalWeightCarried = computed(() => {
  return Math.round(
    characterEquipmentRows.value.reduce((sum, row) => {
      if (!row.equipment) return sum
      return row.isCarried ? sum + row.equipment.weight * row.quantity : sum
    }, 0),
  )
})

// Methods
// Collapsed/Expanded State Management

const updateEquipmentItem = (index, key, value) => {
  // Create a new array of equipment items
  const updatedEquipment = [...props.character.equipment]

  // Update the specific property on the item at the given index
  updatedEquipment[index] = {
    ...updatedEquipment[index],
    [key]: value,
  }

  // Create a new character object with the updated equipment
  const updatedCharacter = {
    ...props.character,
    equipment: updatedEquipment,
  }

  // Emit the update event
  emit('update-character', updatedCharacter)
}

const removeEquipmentItem = (index) => {
  const equipment = characterEquipmentRows.value[index].equipment
  const name = equipment ? equipment.name : 'this item'

  if (confirm(`Are you sure you want to remove ${name} from inventory?`)) {
    // Create a new array without the item at the given index
    const updatedEquipment = props.character.equipment.filter(
      (_, i) => i !== index,
    )

    // Create a new character object with the updated equipment
    const updatedCharacter = {
      ...props.character,
      equipment: updatedEquipment,
    }

    // Emit the update event
    emit('update-character', updatedCharacter)
  }
}

const handleCarriedChange = (index, isCarried) => {
  // Create a new array of equipment items
  const updatedEquipment = [...props.character.equipment]

  // Update the carried property
  updatedEquipment[index] = {
    ...updatedEquipment[index],
    isCarried: isCarried,
  }

  // If unchecking carried, also uncheck wielding
  if (!isCarried && updatedEquipment[index].isWielding) {
    updatedEquipment[index].isWielding = false
  }

  // Create a new character object with the updated equipment
  const updatedCharacter = {
    ...props.character,
    equipment: updatedEquipment,
  }

  // Emit the update event
  emit('update-character', updatedCharacter)
}

const editCustomItem = (equipment) => {
  emit('edit-custom-equipment', equipment)
}

const formatWeight = (value) => {
  return Number.isInteger(value) ? value : value.toFixed(1) // Format to one decimal place
}

const toggleAddOptions = (event) => {
  if (event) {
    event.stopPropagation() // Prevent immediate closing
  }
  showAddOptions.value = !showAddOptions.value
  // Close equipment selector if open
  if (showEquipmentSelector.value) {
    showEquipmentSelector.value = false
  }
}

const addCustomEquipment = async () => {
  // Hide the add options menu
  showAddOptions.value = false

  try {
    // Create a new custom equipment item using the service method
    const createdEquipment = await EquipmentService.createCustomEquipment()

    // Add it to the character's equipment
    const newItem = {
      id: createdEquipment.id,
      quantity: 1,
      isCarried: true,
      isWielding: false, // Initialize wielding state
    }

    // Add the new item to the character's inventory
    CharacterService.addSpecificEquipmentItem(props.character, newItem)

    // Emit the update event to ensure the parent updates the character
    emit('update-character', props.character)

    // Refresh equipment store to ensure the new item is available
    await equipmentStore.fetchAllEquipment()

    // Find the full equipment object from the updated equipment list
    const fullEquipment = (equipmentStore.equipment || []).find(
      (eq) => eq.id === createdEquipment.id
    )

    // Now that the equipment store is updated, emit the edit event with the full object
    if (fullEquipment) {
      emit('edit-custom-equipment', fullEquipment)
    } else {
      // fallback: emit the id if not found (should not happen)
      emit('edit-custom-equipment', createdEquipment.id)
    }
  } catch (error) {
    console.error('Error adding custom equipment:', error)
  }
}

const selectEquipment = (equipment) => {
  const newItem = {
    id: equipment.id,
    quantity: 1,
    isCarried: true,
    isWielding: false, // Initialize wielding state
  }

  CharacterService.addSpecificEquipmentItem(
    props.character,
    newItem,
    props.allEquipment,
  )
  emit('update-character', props.character)
  toggleEquipmentSelector()
}

const handleOutsideClick = (event) => {
  // Handle outside clicks for add options menu
  // Equipment selector is handled by the composable
  const addOptionsMenu = document.querySelector('.add-options-menu')
  const addItemText = document.querySelector('.add-item-text')

  // Close add options menu if clicking outside
  if (
    showAddOptions.value &&
    addOptionsMenu &&
    !addOptionsMenu.contains(event.target) &&
    addItemText &&
    !addItemText.contains(event.target)
  ) {
    showAddOptions.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  showAddOptions.value = false
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
h2 {
  margin: 5px;
}

.equipment-table {
  display: flex;
  flex-direction: column;
  align-items: left;
  background-color: var(--overlay-black-heavy);
  padding: 15px;
  border-radius: var(--radius-5);
  position: relative;
  height: fit-content;
  min-height: 50px;
}

.equipment-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  padding-right: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  position: relative;
}

/* Hide old add-item-footer and add-item-text */
.add-item-footer,
.add-item-text {
  display: none !important;
}

/* Floating Action Button for Add Equipment */
.add-equipment-fab {
  position: absolute;
  left: 50%;
  bottom: -11px;
  transform: translateX(-50%);
  z-index: var(--z-dropdown);
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-gray-medium) 60%, var(--color-gray-dark) 100%);
  color: var(--color-text-primary);
  font-size: var(--font-size-18);
  border: none;
  box-shadow: var(--shadow-elevation-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-color-bg), box-shadow var(--transition-normal);
  padding: 0;
}

.add-equipment-fab:hover {
  background: linear-gradient(135deg, var(--color-gray-light) 60%, var(--color-gray-medium) 100%);
}

/* Equipment row styles */
.equipment-row {
  display: flex;
  flex-direction: row;
  /* Change from column to row to separate controls from card+details */
  align-items: stretch;
  margin-bottom: 10px;
  border-radius: var(--radius-5);
  overflow: hidden;
  width: 100%;
  position: relative;
  overflow: visible;
}

.equipment-row-flex {
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
}

.equipment-card {
  flex: 1 1 0%;
  width: 100%;
  min-width: 0;
  padding: 7px;
  text-align: left;
  margin-bottom: 0;
}

.equipment-row-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background-color: var(--overlay-white-medium);
  border-radius: 0 0 var(--radius-5) var(--radius-5);
  width: 100%;
  /* Ensure it matches the card width */
  margin-left: 0;
  /* No offset under controls */
  box-sizing: border-box;
}

.details-content {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-14);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-grow: 1;
  justify-content: flex-start;
}

.checkbox-item {
  margin-left: -5px;
}

/* Floating edit controls for each equipment row */
.floating-edit-controls {
  position: absolute;
  left: -18px;
  top: 2px;
  transform: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: var(--z-dropdown);
  pointer-events: auto;
}

.equipment-row {
  position: relative;
  overflow: visible;
}

/* Hide old edit-controls in edit mode */
.edit-controls {
  display: none !important;
}

/* Delete button style */
.fab-delete {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-danger);
  border: none;
  font-size: var(--font-size-16);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-color-bg);
  padding: 0;
}

.fab-delete:hover {
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-text-primary);
}

/* Drag handle button style */
.fab-drag {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-gray-light);
  font-size: var(--font-size-18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  transition: var(--transition-color-bg);
}

.fab-drag:hover {
  /* Keep background unchanged on hover */
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-gray-dark);
}

.missing-equipment {
  color: var(--color-text-muted);
  font-style: italic;
  padding: 10px;
}

.equipment-checkbox {
  width: 12px;
  height: 12px;
  cursor: pointer;
  margin-left: 10px;
}

.disabled-checkbox {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled-text {
  color: var(--color-text-muted);
}

.carried-weight {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-14);
}

.carried-weight span {
  display: inline-block;
  min-width: 25px;
  text-align: right;
}

/* Add Options Menu */
.add-options-menu {
  position: absolute;
  bottom: 30px;
  right: 0;
  background-color: var(--overlay-black-medium);
  border-radius: var(--radius-8);
  z-index: var(--z-dropdown);
  width: 200px;
  overflow: hidden;
}

.add-option {
  padding: 10px;
  cursor: pointer;
  transition: var(--transition-background);
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
}

.add-option i {
  margin-right: 8px;
  width: 20px;
  text-align: center;
}

.add-option:hover {
  background-color: var(--overlay-white-subtle);
}

/* Equipment Selector Styles */
.equipment-selector-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 500px;
  max-height: 80vh;
  background-color: var(--overlay-black-medium);
  border-radius: var(--radius-8);
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
}

.equipment-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--overlay-white-subtle);
}

.equipment-search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-4);
  background-color: var(--overlay-white-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-16);
}

.close-selector {
  font-size: var(--font-size-24);
  margin-left: 15px;
  cursor: pointer;
  color: var(--color-gray-light);
}

.close-selector:hover {
  color: var(--color-text-primary);
}

.equipment-options-container {
  overflow-y: auto;
  max-height: calc(80vh - 60px);
  padding: 10px;
}

.equipment-source-group {
  margin-bottom: 15px;
}

.source-header {
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-light);
  padding: 5px 0;
  border-bottom: 1px solid var(--overlay-white-subtle);
  margin-bottom: 8px;
}

.equipment-option {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--radius-4);
  transition: var(--transition-background);
}

.equipment-option:hover {
  background-color: var(--overlay-white-subtle);
}

.equipment-weight {
  color: var(--color-gray-light);
  font-size: var(--font-size-14);
  margin-left: 5px;
}

.total-weight-container {
  display: flex;
  align-items: center;
  background-color: var(--color-gray-dark);
  padding: 5px 10px;
  border-radius: var(--radius-5);
  width: auto;
  gap: 5px;
}

.total-weight-carried {
  font-size: var(--font-size-10);
  font-style: italic;
  white-space: nowrap;
  margin-top: 2px;
}

.equipment-lbs-carried {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  min-width: 55px;
  text-align: right;
}

@media (max-width: var(--breakpoint-sm)) {
  .equipment-table {
    width: 95%;
    margin: 10px;
    padding: 10px;
  }

  .details-content {
    flex-wrap: wrap;
  }
}
</style>
