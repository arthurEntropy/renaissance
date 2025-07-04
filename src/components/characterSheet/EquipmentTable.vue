<template>
  <div class="equipment-table">
    <!-- TITLE -->
    <div class="equipment-table-header">
      <div class="header-left">
        <h2>Equipment</h2>
        <button class="edit-mode-button" @click="toggleEditMode"
          :title="isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'">
          {{ isEditMode ? '✓' : '✎' }}
        </button>
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
                :sources="sources" class="equipment-card" @edit="editCustomItem" :collapsible="true"
                :show-sol-badge="false" />
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
      <div class="add-option" @click="toggleEquipmentSelector($event)">
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
            <div class="source-header">{{ getSourceName(source) }}</div>
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

<script>
import CharacterService from '@/services/CharacterService'
import EquipmentCard from '@/components/EquipmentCard.vue'
import EquipmentService from '@/services/EquipmentService'
import { useEquipmentStore } from '@/stores/equipmentStore'
import draggable from 'vuedraggable'
import NumberInput from '@/components/NumberInput.vue'

export default {
  props: {
    equipment: Array,
    allEquipment: Array,
    character: Object,
    sources: {
      type: Object,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: []
      })
    }
  },
  emits: ['update-character', 'edit-custom-equipment'],
  components: {
    EquipmentCard,
    draggable,
    NumberInput,
  },
  data() {
    return {
      showEquipmentSelector: false,
      showAddOptions: false,
      equipmentSearchQuery: '',
      filteredEquipment: [],
      equipmentStore: useEquipmentStore(),
      isEditMode: false, // New state for edit mode
      equipmentCollapseState: {}, // Track collapsed/expanded state by equipment ID
    }
  },
  computed: {
    characterEquipmentRows() {
      const allEquipment = this.allEquipment || [] // Fallback to an empty array
      return this.character.equipment.map((entry) => {
        const equipment = allEquipment.find((eq) => eq.id === entry.id)
        return {
          ...entry,
          equipment,
        }
      })
    },
    sortedEquipmentRows: {
      get() {
        // Sort by index property (if exists)
        return [...this.characterEquipmentRows].sort((a, b) => {
          if (a.index !== undefined && b.index !== undefined) {
            return a.index - b.index
          }
          // If index is not defined, use original position
          return 0
        })
      },
      set(value) {
        // This will be called when draggable updates the order
        this.updateEquipmentOrder(value)
      },
    },
    totalWeightCarried() {
      return Math.round(
        this.characterEquipmentRows.reduce((sum, row) => {
          if (!row.equipment) return sum
          return row.isCarried ? sum + row.equipment.weight * row.quantity : sum
        }, 0),
      )
    },
    groupedEquipment() {
      const grouped = {
        general: [], // For items without a source or with an unknown source
        custom: [], // For custom items
      }

      const items =
        this.filteredEquipment.length > 0
          ? this.filteredEquipment
          : this.allEquipment || []

      // Group items
      items
        .filter((item) => !item.isDeleted)
        .forEach((item) => {
          if (item.isCustom === true) {
            // Custom items go to the custom group
            grouped.custom.push(item)
          } else if (
            !item.source ||
            !this.getSourceById(item.source)
          ) {
            // Items without a source or with an unrecognized source go to the general group
            grouped.general.push(item)
          } else {
            // All other items are grouped by their source
            const sourceId = item.source
            if (!grouped[sourceId]) {
              grouped[sourceId] = []
            }
            grouped[sourceId].push(item)
          }
        })

      // Sort items within each group by name
      Object.keys(grouped).forEach((key) => {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name))
      })

      // Return a new ordered object to control the display order
      const orderedGrouped = {}

      // 1. General items first (if any exist)
      if (grouped.general.length > 0) {
        orderedGrouped.general = grouped.general
      }

      // 2. Add all other source groups (sorted alphabetically by source name)
      const sourceKeys = Object.keys(grouped)
        .filter((key) => key !== 'custom' && key !== 'general')
        .sort((a, b) => {
          const sourceNameA = this.getSourceName(a)
          const sourceNameB = this.getSourceName(b)
          return sourceNameA.localeCompare(sourceNameB)
        })

      sourceKeys.forEach((key) => {
        orderedGrouped[key] = grouped[key]
      })

      // 3. Custom items last (if any exist)
      if (grouped.custom.length > 0) {
        orderedGrouped.custom = grouped.custom
      }

      return orderedGrouped
    },
  },
  methods: {
    // Collapsed/Expanded State Management
    getCollapsedState(equipment) {
      // Default to true (collapsed) if not set
      return this.equipmentCollapseState[equipment.id] !== undefined
        ? this.equipmentCollapseState[equipment.id]
        : true
    },
    setCollapsedState(equipment, collapsed) {
      this.equipmentCollapseState = {
        ...this.equipmentCollapseState,
        [equipment.id]: collapsed
      }
    },

    updateEquipmentOrder(newOrder) {
      // Update the index property on each equipment item
      const updatedEquipment = newOrder.map((item, index) => ({
        ...item,
        index: index,
      }))

      // Create a new character object with updated equipment
      const updatedCharacter = {
        ...this.character,
        equipment: updatedEquipment,
      }

      // Emit the update event with the new character object
      this.$emit('update-character', updatedCharacter)
    },

    onDragEnd() {
      // This will be called after a drag operation completes
      // We don't need to do anything here since the v-model binding will handle the update
    },

    updateEquipmentItem(index, key, value) {
      // Create a new array of equipment items
      const updatedEquipment = [...this.character.equipment]

      // Update the specific property on the item at the given index
      updatedEquipment[index] = {
        ...updatedEquipment[index],
        [key]: value,
      }

      // Create a new character object with the updated equipment
      const updatedCharacter = {
        ...this.character,
        equipment: updatedEquipment,
      }

      // Emit the update event
      this.$emit('update-character', updatedCharacter)
    },

    removeEquipmentItem(index) {
      const equipment = this.characterEquipmentRows[index].equipment
      const name = equipment ? equipment.name : 'this item'

      if (confirm(`Are you sure you want to remove ${name} from inventory?`)) {
        // Create a new array without the item at the given index
        const updatedEquipment = this.character.equipment.filter(
          (_, i) => i !== index,
        )

        // Create a new character object with the updated equipment
        const updatedCharacter = {
          ...this.character,
          equipment: updatedEquipment,
        }

        // Emit the update event
        this.$emit('update-character', updatedCharacter)
      }
    },

    handleCarriedChange(index, isCarried) {
      // Create a new array of equipment items
      const updatedEquipment = [...this.character.equipment]

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
        ...this.character,
        equipment: updatedEquipment,
      }

      // Emit the update event
      this.$emit('update-character', updatedCharacter)
    },

    editCustomItem(equipment) {
      this.$emit('edit-custom-equipment', equipment)
    },

    formatWeight(value) {
      return Number.isInteger(value) ? value : value.toFixed(1) // Format to one decimal place
    },

    toggleAddOptions(event) {
      if (event) {
        event.stopPropagation() // Prevent immediate closing
      }
      this.showAddOptions = !this.showAddOptions
      // Close equipment selector if open
      if (this.showEquipmentSelector) {
        this.showEquipmentSelector = false
      }
    },

    toggleEquipmentSelector(event) {
      if (event) {
        event.stopPropagation() // Prevent immediate closing
      }
      this.showEquipmentSelector = !this.showEquipmentSelector
      this.showAddOptions = false // Close the add options menu

      if (this.showEquipmentSelector) {
        this.equipmentSearchQuery = ''
        this.filteredEquipment = []
      }
    },

    async addCustomEquipment() {
      // Hide the add options menu
      this.showAddOptions = false

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
        CharacterService.addSpecificEquipmentItem(this.character, newItem)

        // Emit the update event to ensure the parent updates the character
        this.$emit('update-character', this.character)

        // Refresh equipment store to ensure the new item is available
        await this.equipmentStore.fetchAllEquipment()

        // Find the full equipment object from the updated equipment list
        const fullEquipment = (this.equipmentStore.equipment || []).find(
          (eq) => eq.id === createdEquipment.id
        )

        // Now that the equipment store is updated, emit the edit event with the full object
        if (fullEquipment) {
          this.$emit('edit-custom-equipment', fullEquipment)
        } else {
          // fallback: emit the id if not found (should not happen)
          this.$emit('edit-custom-equipment', createdEquipment.id)
        }
      } catch (error) {
        console.error('Error adding custom equipment:', error)
      }
    },

    filterEquipment() {
      const query = this.equipmentSearchQuery.toLowerCase().trim()
      if (!query) {
        this.filteredEquipment = []
        return
      }

      this.filteredEquipment = (this.allEquipment || []).filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)),
      )
    },

    selectEquipment(equipment) {
      const newItem = {
        id: equipment.id,
        quantity: 1,
        isCarried: true,
        isWielding: false, // Initialize wielding state
      }

      CharacterService.addSpecificEquipmentItem(
        this.character,
        newItem,
        this.allEquipment,
      )
      this.$emit('update-character', this.character)
      this.toggleEquipmentSelector()
    },

    getSourceById(sourceId) {
      if (!sourceId) return null;

      // Use sources passed as props if available
      return (
        this.sources.ancestries.find((item) => item.id === sourceId) ||
        this.sources.cultures.find((item) => item.id === sourceId) ||
        this.sources.mestieri.find((item) => item.id === sourceId) ||
        this.sources.worldElements.find((item) => item.id === sourceId) ||
        this.equipmentStore.getSourceById(sourceId)
      );
    },

    getSourceName(sourceId) {
      if (sourceId === 'general') return 'General'
      if (sourceId === 'custom') return 'Custom Items'

      const source = this.getSourceById(sourceId)
      return source ? source.name : 'General'
    },

    handleOutsideClick(event) {
      // References to the dropdown elements
      const addOptionsMenu = this.$el.querySelector('.add-options-menu')
      const equipmentSelector = this.$el.querySelector(
        '.equipment-selector-container',
      )
      const addItemText = this.$el.querySelector('.add-item-text')

      // Close add options menu if clicking outside
      if (
        this.showAddOptions &&
        addOptionsMenu &&
        !addOptionsMenu.contains(event.target) &&
        addItemText &&
        !addItemText.contains(event.target)
      ) {
        this.showAddOptions = false
      }

      // Close equipment selector if clicking outside
      if (
        this.showEquipmentSelector &&
        equipmentSelector &&
        !equipmentSelector.contains(event.target)
      ) {
        this.showEquipmentSelector = false
      }
    },

    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick)
  },

  beforeUnmount() {
    // Ensure dropdowns are closed when component is destroyed
    this.showEquipmentSelector = false
    this.showAddOptions = false
    // Remove the click listener
    document.removeEventListener('click', this.handleOutsideClick)
  },
}
</script>

<style scoped>
h2 {
  margin: 5px;
}

.equipment-table {
  display: flex;
  flex-direction: column;
  align-items: left;
  background-color: black;
  padding: 15px;
  border-radius: 5px;
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

/* Edit Mode Button */
.edit-mode-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.edit-mode-button:hover {
  color: white;
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
  z-index: 110;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #444 60%, #222 100%);
  color: #fff;
  font-size: 1.1rem;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  padding: 0;
}

.add-equipment-fab:hover {
  background: linear-gradient(135deg, #666 60%, #333 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

/* Equipment row styles */
.equipment-row {
  display: flex;
  flex-direction: row;
  /* Change from column to row to separate controls from card+details */
  align-items: stretch;
  margin-bottom: 10px;
  border-radius: 5px;
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
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.equipment-row-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background-color: rgba(60, 60, 60, 0.4);
  border-radius: 0 0 5px 5px;
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
  font-size: 12px;
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
  z-index: 120;
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
  border-radius: 50%;
  background: linear-gradient(135deg, #222 60%, #444 100%);
  color: #ff6b6b;
  border: none;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transition: background 0.2s, color 0.2s;
  padding: 0;
}

.fab-delete:hover {
  background: linear-gradient(135deg, #222 60%, #444 100%);
  color: #fff;
}

/* Drag handle button style */
.fab-drag {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #222 60%, #444 100%);
  color: #aaa;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transition: background 0.2s, color 0.2s;
}

.fab-drag:hover {
  /* Keep background unchanged on hover */
  background: linear-gradient(135deg, #222 60%, #444 100%);
  color: #222;
}

.missing-equipment {
  color: #888;
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
  color: #777;
}

.carried-weight {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
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
  background-color: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 100;
  width: 200px;
  overflow: hidden;
}

.add-option {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  color: #eee;
}

.add-option i {
  margin-right: 8px;
  width: 20px;
  text-align: center;
}

.add-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Equipment Selector Styles */
.equipment-selector-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 500px;
  max-height: 80vh;
  background-color: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.equipment-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.equipment-search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 16px;
}

.close-selector {
  font-size: 24px;
  margin-left: 15px;
  cursor: pointer;
  color: #aaa;
}

.close-selector:hover {
  color: white;
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
  font-weight: bold;
  color: #aaa;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.equipment-option {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.equipment-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.equipment-weight {
  color: #aaa;
  font-size: 0.9em;
  margin-left: 5px;
}

.total-weight-container {
  display: flex;
  align-items: center;
  background-color: rgb(61, 61, 61);
  padding: 5px 10px;
  border-radius: 5px;
  width: auto;
  gap: 5px;
}

.total-weight-carried {
  font-size: 10px;
  font-style: italic;
  white-space: nowrap;
  margin-top: 2px;
}

.equipment-lbs-carried {
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  min-width: 55px;
  text-align: right;
}

@media (max-width: 650px) {
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
