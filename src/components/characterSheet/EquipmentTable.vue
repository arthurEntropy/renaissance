<template>
  <div class="equipment-table">

    <!-- TITLE -->
    <div class="equipment-table-header">
      <div class="header-left">
        <h2>Equipment</h2>
        <em @click="toggleAddOptions()" class="add-item-text">add item</em>
        
        <!-- Add Options Menu -->
        <div v-if="showAddOptions" class="add-options-menu header-add-menu">
          <div class="add-option" @click="toggleEquipmentSelector()">
            <i class="fas fa-book"></i> Add from Library
          </div>
          <div class="add-option" @click="addCustomEquipment()">
            <i class="fas fa-plus-circle"></i> Add Custom Item
          </div>
        </div>
      </div>
      <div class="total-weight-container">
        <span class="total-weight-carried">Total Weight Carried:</span>
        <span class="equipment-lbs-carried">{{ totalWeightCarried }} lbs</span>
      </div>
    </div>

    <!-- ITEM ROWS -->
    <div
      v-for="(row, index) in characterEquipmentRows"
      :key="row.id"
      class="equipment-row"
    >
      <!-- EquipmentCard (collapsed/minimal) -->
      <EquipmentCard
        v-if="row.equipment"
        :equipment="row.equipment"
        :collapsed="true"
        :editable="row.equipment.isCustom"
        class="equipment-card"
        @edit="editCustomItem"
      />
      <span v-else class="missing-equipment">Unknown item</span>

      <div class="equipment-row-details">
        <!-- Quantity -->
        <em class="carried"> x </em>
        <input
          type="number"
          v-model.number="row.quantity"
          min="1"
          class="input-small quantity-input"
          @input="updateEquipmentItem(index, 'quantity', Math.max(1, row.quantity))"
        />

        <!-- Carried Weight -->
        <em> = </em>
        <div>
          <span>
            {{ row.isCarried && row.equipment ? formatWeight(row.equipment.weight * row.quantity) : '0' }}
          </span>
          <em>&nbsp; lbs</em>
        </div>

        <!-- Carried Checkbox -->
        <div>
          <input
            type="checkbox"
            v-model="row.isCarried"
            @change="updateEquipmentItem(index, 'isCarried', row.isCarried)"
          />
          <em class="carried"> carried</em>
        </div>

        <!-- Delete Button -->
        <span @click="removeEquipmentItem(index)" class="delete-item-link">ⓧ</span>
      </div>
    </div>

    <!-- Equipment Selector Dropdown -->
    <div v-if="showEquipmentSelector" class="equipment-selector-container">
      <div class="equipment-selector-header">
        <input 
          type="text" 
          v-model="equipmentSearchQuery" 
          placeholder="Search equipment..." 
          class="equipment-search"
          @input="filterEquipment"
        />
        <span @click="toggleEquipmentSelector()" class="close-selector">×</span>
      </div>
      <div class="equipment-options-container">
        <template v-for="(items, source) in groupedEquipment" :key="source">
          <div class="equipment-source-group">
            <div class="source-header">{{ getSourceName(source) }}</div>
            <div 
              v-for="item in items" 
              :key="item.id" 
              class="equipment-option"
              @click="selectEquipment(item)"
            >
              {{ item.name }} <span class="equipment-weight">({{ item.weight }} lbs)</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  import CharacterService from "@/services/CharacterService";
  import EquipmentCard from "@/components/EquipmentCard.vue";
  import EquipmentService from "@/services/EquipmentService";
  import { useEquipmentStore } from '@/stores/equipmentStore';

  export default {
    props: {
      equipment: Array,
      allEquipment: Array,
      character: Object,
    },
    emits: ["update-character", "edit-custom-equipment"],
    components: {
      EquipmentCard,
    },
    data() {
      return {
        showEquipmentSelector: false,
        showAddOptions: false,
        equipmentSearchQuery: '',
        filteredEquipment: [],
        equipmentStore: useEquipmentStore(),
      };
    },
    computed: {
      characterEquipmentRows() {
        const allEquipment = this.allEquipment || [];
        return this.character.equipment.map(entry => {
          const equipment = allEquipment.find(eq => eq.id === entry.id);
          return {
            ...entry,
            equipment,
          };
        });
      },
      totalWeightCarried() {
        return Math.round(
          this.characterEquipmentRows.reduce((sum, row) => {
            if (!row.equipment) return sum;
            return row.isCarried ? sum + (row.equipment.weight * row.quantity) : sum;
          }, 0)
        );
      },
      groupedEquipment() {
        const grouped = {
          general: [], // For items without a source or with an unknown source
          custom: []   // For custom items
        };
        
        const items = this.filteredEquipment.length > 0 
          ? this.filteredEquipment 
          : this.allEquipment || [];
        
        // Group items
        items
          .filter(item => !item.isDeleted)
          .forEach(item => {
            if (item.isCustom === true) {
              // Custom items go to the custom group
              grouped.custom.push(item);
            } else if (!item.source || !this.equipmentStore.getSourceById(item.source)) {
              // Items without a source or with an unrecognized source go to the general group
              grouped.general.push(item);
            } else {
              // All other items are grouped by their source
              const sourceId = item.source;
              if (!grouped[sourceId]) {
                grouped[sourceId] = [];
              }
              grouped[sourceId].push(item);
            }
          });
        
        // Sort items within each group by name
        Object.keys(grouped).forEach(key => {
          grouped[key].sort((a, b) => a.name.localeCompare(b.name));
        });
        
        // Return a new ordered object to control the display order
        const orderedGrouped = {};
        
        // 1. General items first (if any exist)
        if (grouped.general.length > 0) {
          orderedGrouped.general = grouped.general;
        }
        
        // 2. Add all other source groups (sorted alphabetically by source name)
        const sourceKeys = Object.keys(grouped)
          .filter(key => key !== 'custom' && key !== 'general')
          .sort((a, b) => {
            const sourceNameA = this.getSourceName(a);
            const sourceNameB = this.getSourceName(b);
            return sourceNameA.localeCompare(sourceNameB);
          });
        
        sourceKeys.forEach(key => {
          orderedGrouped[key] = grouped[key];
        });
        
        // 3. Custom items last (if any exist)
        if (grouped.custom.length > 0) {
          orderedGrouped.custom = grouped.custom;
        }
        
        return orderedGrouped;
      },
    },
    methods: {
      updateEquipmentItem(index, key, value) {
        CharacterService.updateEquipmentItem(this.character, index, key, value);
        this.$emit("update-character", this.character);
      },
      removeEquipmentItem(index) {
        CharacterService.removeEquipmentItem(this.character, index);
        this.$emit("update-character", this.character);
      },
      editCustomItem(equipment) {
        // When the edit button is clicked on a custom item, emit an event to the parent
        this.$emit("edit-custom-equipment", equipment);
      },
      formatWeight(value) {
        return Number.isInteger(value) ? value : value.toFixed(1); // Format to one decimal place
      },
      toggleAddOptions() {
        this.showAddOptions = !this.showAddOptions;
        // Close equipment selector if open
        if (this.showEquipmentSelector) {
          this.showEquipmentSelector = false;
        }
      },
      toggleEquipmentSelector() {
        this.showEquipmentSelector = !this.showEquipmentSelector;
        this.showAddOptions = false; // Close the add options menu
        
        if (this.showEquipmentSelector) {
          this.equipmentSearchQuery = '';
          this.filteredEquipment = [];
        }
      },
      async addCustomEquipment() {
        // Hide the add options menu
        this.showAddOptions = false;
        
        try {
          // Create a new custom equipment item using the service method
          const createdEquipment = await EquipmentService.createCustomEquipment();
          
          // Add it to the character's equipment
          const newItem = {
            id: createdEquipment.id,
            quantity: 1,
            isCarried: true
          };
          
          CharacterService.addSpecificEquipmentItem(this.character, newItem);
          this.$emit("update-character", this.character);
          
          // Refresh equipment list to include the new item
          await this.equipmentStore.fetchAllEquipment();
          
          // Emit event to open the edit modal
          this.$emit("edit-custom-equipment", createdEquipment);
        } catch (error) {
          console.error("Error adding custom equipment:", error);
        }
      },
      filterEquipment() {
        const query = this.equipmentSearchQuery.toLowerCase().trim();
        if (!query) {
          this.filteredEquipment = [];
          return;
        }
        
        this.filteredEquipment = (this.allEquipment || []).filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.description && item.description.toLowerCase().includes(query))
        );
      },
      selectEquipment(equipment) {
        const newItem = {
          id: equipment.id,
          quantity: 1,
          isCarried: true
        };
        
        CharacterService.addSpecificEquipmentItem(this.character, newItem);
        this.$emit("update-character", this.character);
        this.toggleEquipmentSelector();
      },
      getSourceName(sourceId) {
        if (sourceId === 'general') return 'General';
        if (sourceId === 'custom') return 'Custom Items';
        
        const source = this.equipmentStore.getSourceById(sourceId);
        return source ? source.name : 'General';
      },
    },
    mounted() {
      // Initialize the equipment store if needed
      this.equipmentStore.init();
    },
    beforeUnmount() {
      // Ensure dropdowns are closed when component is destroyed
      this.showEquipmentSelector = false;
      this.showAddOptions = false;
    }
  };
</script>

<style scoped>
  h2 {
    margin: 5px;
  }
  .equipment-table {
    display: flex;
    flex-direction: column;
    align-items: left;
    width: 600px;
    margin: 20px;
    background-color: black;  
    padding: 15px;
    border-radius: 5px;
    position: relative; /* For positioning the dropdown */
  }
  .equipment-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 10px; /* Add some spacing when elements wrap */
  }

  .header-left {
    display: flex;
    align-items:last baseline;
    gap: 15px;
    position: relative; /* For absolute positioning of dropdown */
  }

  .add-item-text {
    font-size: 14px;
    color: #aaa;
    cursor: pointer;
    transition: color 0.2s;
  }

  .add-item-text:hover {
    color: white;
    text-decoration: underline;
  }

  /* Reposition the Add Options Menu for header placement */
  .header-add-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 101;
  }
  .equipment-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 5px;
  }
  .add-item-row {
    justify-content: right;
  }
  .equipment-card {
    width: 300px;
    max-width: 300px;
    min-width: 300px;
    padding: 7px;
    text-align: left;
  }
  .equipment-row-details {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    width: 275px;
    padding-top: 10px;
  }
  .equipment-row-details > * {
    display: flex;
    align-items: center;
  }
  .quantity-input {
    margin-left: 2px;
  }
  .total-weight-carried {
    font-size: 14px;
    margin-right: 10px;
    font-style: italic;
  }
  .equipment-lbs-carried {
    font-size: 16px;
    font-weight: bold;
  }
  .delete-item-link {
    cursor: pointer;
    color: gray;
    font-size: 15px;
    text-align: center;
    margin: 0 0 -1px 10px;
  }
  .add-item-link {
    cursor: pointer;
    color: gray;
    font-size: 20px;
    padding-right: 12px;
    position: relative; /* For positioning the popup menu */
  }
  
  /* Add Options Menu */
  .add-item-row {
    position: relative;
    display: flex;
    justify-content: right;
    padding-right: 50px;
  }
  
  .add-options-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: rgba(30, 30, 30, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    z-index: 100;
    width: 200px;
    overflow: hidden;
  }
  
  .add-option {
    padding: 12px 15px;
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

  .carried {
    margin-left: 2px;
    font-size: 12px;
  }

  .total-weight-container {
    background-color: rgb(61, 61, 61);
    padding: 5px 15px;
    border-radius: 5px;
  }
</style>