<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- Centered Modal Title -->
      <h2 class="modal-header centered">Edit Equipment</h2>

      <form @submit.prevent="saveEquipment">
        <!-- Centered ID Display -->
        <div class="form-group centered">
          <label>ID:</label>
          <span>{{ equipment.id }}</span>
        </div>
        
        <!-- Custom Item Checkbox -->
        <div class="form-group centered">
          <label for="isCustom">
            <input type="checkbox" id="isCustom" v-model="editedEquipment.isCustom" />
            Custom Item
          </label>
        </div>

        <!-- Name -->
        <div class="form-group vertical">
          <label for="name" class="left-aligned">Name:</label>
          <input type="text" id="name" v-model="editedEquipment.name" class="modal-input" />
        </div>

        <!-- Art URL -->
        <div class="form-group vertical">
          <label for="artUrl" class="left-aligned">Art URL:</label>
          <input type="text" id="artUrl" v-model="editedEquipment.artUrl" class="modal-input" />
        </div>

        <!-- Description -->
        <div class="form-group vertical description">
          <label for="description" class="left-aligned">Description:</label>
          <textarea id="description" v-model="editedEquipment.description" class="modal-input"></textarea>
        </div>

        <!-- Weight, Source, and Standard of Living -->
        <div class="form-group row">
          <div class="form-column small-weight-input">
            <label for="weight" class="left-aligned">Weight:</label>
            <input 
              type="number" 
              id="weight" 
              v-model.number="editedEquipment.weight" 
              min="0" 
              step="0.1" 
              @blur="ensureWeightValue"
              class="modal-input" 
            />
          </div>
          <div class="form-column expanded-source-dropdown">
            <label for="source" class="left-aligned">Source:</label>
            <select id="source" v-model="editedEquipment.source" class="modal-input">
              <optgroup label="Ancestries">
                <option v-for="ancestry in sources.ancestries" :key="ancestry.id" :value="ancestry.id">
                  {{ ancestry.name }}
                </option>
              </optgroup>
              <optgroup label="Cultures">
                <option v-for="culture in sources.cultures" :key="culture.id" :value="culture.id">
                  {{ culture.name }}
                </option>
              </optgroup>
              <optgroup label="Mestieri">
                <option v-for="mestiere in sources.mestieri" :key="mestiere.id" :value="mestiere.id">
                  {{ mestiere.name }}
                </option>
              </optgroup>
              <optgroup label="World Elements">
                <option v-for="worldElement in sources.worldElements" :key="worldElement.id" :value="worldElement.id">
                  {{ worldElement.name }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="form-column standard-of-living">
            <label for="standardOfLiving" class="left-aligned">Standard of Living:</label>
            <select id="standardOfLiving" v-model="editedEquipment.standardOfLiving" class="modal-input">
              <option v-for="sol in standardsOfLiving" :key="sol.id" :value="sol.id">
                {{ sol.name }} ({{ sol.cost }})
              </option>
            </select>
          </div>
        </div>

        <!-- Melee Weapon Checkbox -->
        <div class="form-group centered melee-checkbox">
          <label for="isMelee">
            <input type="checkbox" id="isMelee" v-model="editedEquipment.isMelee" />
            Melee Weapon
          </label>
        </div>

        <!-- Engagement Dice -->
        <div v-if="editedEquipment.isMelee" class="form-group vertical">
          <label>Engagement Dice:</label>
          <div class="dice-row">
            <div v-for="dieType in dieTypes" :key="'engagement-' + dieType" class="dice-column">
              <i :class="getDiceFontClass(dieType)" class="dice-icon"></i>
              <input
                type="number"
                min="0"
                v-model.number="engagementDiceCounts[dieType]"
                class="dice-input"
              />
            </div>
          </div>
        </div>

        <!-- Damage Dice -->
        <div v-if="editedEquipment.isMelee" class="form-group vertical">
          <label>Damage Dice:</label>
          <div class="dice-row">
            <div v-for="dieType in dieTypes" :key="'damage-' + dieType" class="dice-column">
              <i :class="getDiceFontClass(dieType)" class="dice-icon"></i>
              <input
                type="number"
                min="0"
                v-model.number="damageDiceCounts[dieType]"
                class="dice-input"
              />
            </div>
          </div>
        </div>

        <!-- Engagement Successes -->
        <div v-if="editedEquipment.isMelee" class="form-group vertical">
          <label>Engagement Successes:</label>
          <div class="engagement-success-container">
            <div
              v-for="success in engagementSuccessOptions"
              :key="success.id"
              class="engagement-success-pill"
            >
              <input
                type="checkbox"
                :id="'success-' + success.id"
                :value="success.id"
                v-model="editedEquipment.engagementSuccesses"
                class="pill-checkbox"
              />
              <label :for="'success-' + success.id">{{ success.name }}</label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-buttons">
          <button type="button" class="button button-primary" @click="saveEquipment">Save Changes</button>
          <button type="button" class="button" @click="closeModal">Cancel</button>
          <button type="button" class="button button-danger" @click="deleteEquipment">Delete</button>
        </div>
      </form>
    </div>
  </div>
</template>
  
<script>
  import { useEquipmentStore } from '@/stores/equipmentStore';
  import StandardOfLivingService from '@/services/StandardOfLivingService';
  import EngagementSuccessService from '@/services/EngagementSuccessService';
  
  export default {
    props: {
      equipmentId: {
        type: String,
        required: true,
      },
    },
    computed: {
      equipment() {
        return this.equipmentStore.equipment.find(eq => eq.id === this.equipmentId) || {}; // Fallback to an empty object
      },
    },
  
    emits: ["update", "delete", "close"],
  
    data() {
      return {
        editedEquipment: null,
        originalEquipment: null,
        sources: {
          ancestries: [],
          cultures: [],
          mestieri: [],
          worldElements: [],
        },
        standardsOfLiving: [],
        engagementSuccessOptions: [],
        equipmentStore: useEquipmentStore(),
        dieTypes: [4, 6, 8, 10, 12, 20], // Supported die types
        engagementDiceCounts: {}, // Object to store counts of each engagement die type
        damageDiceCounts: {}, // Object to store counts of each damage die type
      };
    },
    
    created() {
      // Deep clone the equipment to avoid direct mutations and preserve original state
      this.originalEquipment = JSON.parse(JSON.stringify(this.equipment));
      this.editedEquipment = JSON.parse(JSON.stringify(this.equipment));
      
      // Ensure all properties exist with correct default values
      this.editedEquipment.name = this.editedEquipment.name || "New Custom Item";
      this.editedEquipment.isCustom = this.editedEquipment.isCustom || false;
      this.editedEquipment.weight = this.editedEquipment.weight !== undefined ? 
        this.editedEquipment.weight : 0; // Explicitly handle weight
      this.editedEquipment.engagementSuccesses = this.editedEquipment.engagementSuccesses || [];
      this.editedEquipment.engagementDice = this.editedEquipment.engagementDice || [];
      this.editedEquipment.damageDice = this.editedEquipment.damageDice || [];
      this.editedEquipment.skillMods = this.editedEquipment.skillMods || [];
    },
  
    methods: {
      async fetchSources() {
        await this.equipmentStore.fetchAllSources();
        this.sources = this.equipmentStore.sources;
      },
  
      async fetchStandardsOfLiving() {
        this.standardsOfLiving = await StandardOfLivingService.getAllStandardsOfLiving();
      },
      
      getDiceFontClass(dieType) {
        return `df-d${dieType}-${dieType}`;
      },
      
      ensureWeightValue() {
        // Ensure weight is never undefined or null
        if (this.editedEquipment.weight === undefined || 
            this.editedEquipment.weight === null || 
            isNaN(this.editedEquipment.weight)) {
          this.editedEquipment.weight = 0;
        }
      },
  
      initializeDiceCounts() {
        // Initialize engagement dice counts
        this.engagementDiceCounts = this.convertDiceListToCounts(this.editedEquipment.engagementDice || []);
        // Initialize damage dice counts
        this.damageDiceCounts = this.convertDiceListToCounts(this.editedEquipment.damageDice || []);
      },

      convertDiceListToCounts(diceList) {
        // Convert a list of dice (e.g., [4, 6, 6, 8]) to an object with counts
        const counts = {};
        this.dieTypes.forEach(dieType => {
          counts[dieType] = diceList.filter(die => die === dieType).length;
        });
        return counts;
      },

      convertCountsToDiceList(diceCounts) {
        // Convert an object with counts (e.g., {4: 1, 6: 2, 8: 1}) to a list of dice
        const diceList = [];
        Object.entries(diceCounts).forEach(([dieType, count]) => {
          for (let i = 0; i < count; i++) {
            diceList.push(Number(dieType));
          }
        });
        return diceList;
      },

      saveDiceChanges() {
        // Save the updated dice counts back to the equipment object
        this.editedEquipment.engagementDice = this.convertCountsToDiceList(this.engagementDiceCounts);
        this.editedEquipment.damageDice = this.convertCountsToDiceList(this.damageDiceCounts);
      },
  
      addSkillMod() {
        if (!this.editedEquipment.skillMods) this.editedEquipment.skillMods = [];
        this.editedEquipment.skillMods.push({
          name: "",
          diceMod: 0,
          isFavored: false,
          isIllFavored: false
        });
      },
  
      removeSkillMod(index) {
        this.editedEquipment.skillMods.splice(index, 1);
      },
  
      deleteEquipment() {
        const name = this.editedEquipment.name || "this item";
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
          this.$emit("delete", this.editedEquipment);
        }
      },
  
      saveEquipment() {
        if (!this.editedEquipment.id) {
          console.error("Cannot save equipment: Missing ID");
          return;
        }

        this.saveDiceChanges();
        this.ensureWeightValue(); // Make sure weight is properly set
        this.$emit("update", this.editedEquipment);
        this.$emit("close");
      },
      
      closeModal() {
        this.$emit("close");
      },

      async fetchEngagementSuccessOptions() {
        this.engagementSuccessOptions = await EngagementSuccessService.getAllEngagementSuccesses();
      },

      getEngagementSuccessName(id) {
        const success = this.engagementSuccessOptions.find(success => success.id === id);
        return success ? success.name : "Unknown";
      },

      addSelectedEngagementSuccess() {
        if (!this.editedEquipment.engagementSuccesses) {
          this.editedEquipment.engagementSuccesses = [];
        }
        if (!this.editedEquipment.engagementSuccesses.includes(this.selectedEngagementSuccess)) {
          this.editedEquipment.engagementSuccesses.push(this.selectedEngagementSuccess);
        }
        this.selectedEngagementSuccess = ""; // Reset the dropdown
      },

      removeEngagementSuccess(index) {
        this.editedEquipment.engagementSuccesses.splice(index, 1);
      },
    },
  
    async mounted() {
      await Promise.all([
        this.fetchSources(),
        this.fetchStandardsOfLiving(),
        this.fetchEngagementSuccessOptions(),
      ]);
      this.initializeDiceCounts(); // Initialize dice counts after fetching data
    },
  };
</script>
  
<style scoped>
.modal-content {
  max-width: 500px;
}
/* Centered Title and ID */
.modal-header.centered,
.form-group.centered {
  text-align: center;
}

.left-aligned {
  text-align: left;
}

/* Description Section */
.description textarea {
  height: 150px; /* Double the default height */
}

/* Row Layout for Weight, Source, and Standard of Living */
.form-group.row {
  display: flex;
  justify-content: space-between;
  gap: 10px; /* Add gap between columns */
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.small-weight-input {
  flex-grow: 0.25;
  margin-right: 35px;
}

.expanded-source-dropdown {
  flex: 1.5;
}

/* Melee Weapon Checkbox */
.melee-checkbox {
  margin: 20px 0;
  text-align: center;
}

/* Form Buttons */
.form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 10px;
}

.button {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.button-primary {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.button-danger {
  background-color: #f44336;
  color: white;
  border: none;
}

.button:hover {
  opacity: 0.9;
}

/* Dice Row and Column */
.dice-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.dice-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

/* DiceFont Icon */
.dice-icon {
  font-size: 36px;
  color: white;
}

/* Dice Input */
.dice-input {
  width: 50px;
  text-align: center;
  padding: 5px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-group.vertical {
  margin-bottom: 20px; /* Add vertical spacing between sections */
  text-align: left;
}

.engagement-success-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  padding: 10px; /* Add padding around the engagement successes section */
  background-color: rgba(0, 0, 0, 0.1); /* Optional: Add a subtle background for clarity */
  border-radius: 5px;
}

.engagement-success-pill {
  display: flex;
  align-items: center;
  background-color: black;
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  text-align: center;
  gap: 5px;
}

.pill-checkbox {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-radius: 3px;
  background-color: black;
  cursor: pointer;
  margin-right: 5px;
}

.pill-checkbox:checked {
  background-color: white;
  border-color: white;
}

.pill-checkbox:checked::after {
  content: "✔";
  display: block;
  color: black;
  font-size: 12px;
  text-align: center;
  line-height: 16px;
}

.pill-checkbox:hover {
  border-color: gray;
}
</style>