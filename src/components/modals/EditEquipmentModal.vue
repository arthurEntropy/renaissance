<template>
  <div class="modal-overlay">
    <div class="modal-content">

      <!-- Header -->
      <h2 class="modal-header centered">Edit Equipment</h2>

      <form @submit.prevent="saveEquipment">

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
          <TextEditor v-model="editedEquipment.description" :placeholder="'Enter equipment description...'"
            :height="'250px'" :auto-height="false" />
        </div>

        <div class="form-group row">

          <!-- Weight -->
          <div class="form-column weight-input">
            <label for="weight" class="left-aligned">Weight:</label>
            <input type="number" id="weight" v-model.number="editedEquipment.weight" min="0" class="modal-input" />
          </div>

          <!-- Source -->
          <div class="form-column source-dropdown">
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

          <!-- Standard of Living -->
          <div class="form-column">
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
              <input type="number" min="0" v-model.number="engagementDiceCounts[dieType]" class="dice-input" />
            </div>
          </div>
        </div>

        <!-- Damage Dice -->
        <div v-if="editedEquipment.isMelee" class="form-group vertical">
          <label>Damage Dice:</label>
          <div class="dice-row">
            <div v-for="dieType in dieTypes" :key="'damage-' + dieType" class="dice-column">
              <i :class="getDiceFontClass(dieType)" class="dice-icon"></i>
              <input type="number" min="0" v-model.number="damageDiceCounts[dieType]" class="dice-input" />
            </div>
          </div>
        </div>

        <!-- Engagement Successes -->
        <div v-if="editedEquipment.isMelee" class="form-group vertical">
          <label>Engagement Successes:</label>
          <div class="engagement-success-container">
            <div v-for="success in engagementSuccessOptions" :key="success.id" class="engagement-success-pill">
              <input type="checkbox" :id="'success-' + success.id" :value="success.id"
                v-model="editedEquipment.engagementSuccesses" class="pill-checkbox" />
              <label :for="'success-' + success.id">{{ success.name }}</label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-buttons">
          <button type="button" class="button button-primary" @click="saveEquipment">
            Save Changes
          </button>
          <button type="button" class="button" @click="closeModal">
            Cancel
          </button>
          <button type="button" class="button button-danger" @click="deleteEquipment">
            Delete
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script>
import { useEquipmentStore } from '@/stores/equipmentStore'
import TextEditor from '@/components/TextEditor.vue'

export default {
  props: {
    equipment: {
      type: Object,
      required: true,
    },
    allEquipment: {
      type: Array,
      default: () => [],
    },
    standardsOfLiving: {
      type: Array,
      default: () => [],
    },
    sources: {
      type: Object,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      }),
    },
    engagementSuccessOptions: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['update', 'delete', 'close'],

  data() {
    return {
      editedEquipment: null,
      originalEquipment: null,
      equipmentStore: useEquipmentStore(),
      dieTypes: [4, 6, 8, 10, 12, 20], // Supported die types
      engagementDiceCounts: {},
      damageDiceCounts: {},
    }
  },

  created() {
    this.originalEquipment = JSON.parse(JSON.stringify(this.equipment))
    this.editedEquipment = JSON.parse(JSON.stringify(this.equipment))
  },

  components: { TextEditor },

  methods: {
    getDiceFontClass(dieType) {
      return `df-d${dieType}-${dieType}` // Format for DiceFont classes
    },

    initializeDiceCounts() {
      this.engagementDiceCounts = this.convertDiceListToCounts(
        this.editedEquipment.engagementDice || [],
      )
      this.damageDiceCounts = this.convertDiceListToCounts(
        this.editedEquipment.damageDice || [],
      )
    },

    convertDiceListToCounts(diceList) {
      // Convert a list of dice (e.g., [4, 6, 6, 8]) to an object with counts
      const counts = {}
      this.dieTypes.forEach((dieType) => {
        counts[dieType] = diceList.filter((die) => die === dieType).length
      })
      return counts
    },

    convertCountsToDiceList(diceCounts) {
      // Convert an object with counts (e.g., {4: 1, 6: 2, 8: 1}) to a list of dice
      const diceList = []
      Object.entries(diceCounts).forEach(([dieType, count]) => {
        for (let i = 0; i < count; i++) {
          diceList.push(Number(dieType))
        }
      })
      return diceList
    },

    saveDiceChanges() {
      this.editedEquipment.engagementDice = this.convertCountsToDiceList(
        this.engagementDiceCounts,
      )
      this.editedEquipment.damageDice = this.convertCountsToDiceList(
        this.damageDiceCounts,
      )
    },

    deleteEquipment() {
      const name = this.editedEquipment.name || 'this item'
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        this.$emit('delete', this.editedEquipment)
      }
    },

    saveEquipment() {
      if (!this.editedEquipment.id) {
        console.error('Cannot save equipment: Missing ID')
        return
      }
      this.saveDiceChanges()
      // Ensure weight is a valid number
      this.editedEquipment.weight = Number.isFinite(this.editedEquipment.weight) ? this.editedEquipment.weight : 0
      this.$emit('update', this.editedEquipment)
      this.$emit('close')
    },

    closeModal() {
      this.$emit('close')
    },

    getEngagementSuccessName(id) {
      const success = this.engagementSuccessOptions.find(
        (success) => success.id === id,
      )
      return success ? success.name : 'Unknown'
    },

    addSelectedEngagementSuccess() {
      if (!this.editedEquipment.engagementSuccesses) {
        this.editedEquipment.engagementSuccesses = []
      }
      if (
        !this.editedEquipment.engagementSuccesses.includes(
          this.selectedEngagementSuccess,
        )
      ) {
        this.editedEquipment.engagementSuccesses.push(
          this.selectedEngagementSuccess,
        )
      }
      this.selectedEngagementSuccess = ''
    },

    removeEngagementSuccess(index) {
      this.editedEquipment.engagementSuccesses.splice(index, 1)
    },
  },

  mounted() {
    this.initializeDiceCounts()
  },
}
</script>

<style scoped>
.modal-content {
  width: 500px;
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.weight-input {
  flex: 0.25;
  margin-right: 35px;
}

.source-dropdown {
  flex: 1.5;
}

.melee-checkbox {
  margin: 20px 0;
}

/* Dice styles */
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

.dice-icon {
  font-size: 36px;
}

.dice-input {
  width: 50px;
  text-align: center;
  padding: 5px;
  font-size: 14px;
  border: 1px solid lightgray;
  border-radius: 4px;
}

/* Engagement success styles */
.engagement-success-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  padding: 10px;
}

.engagement-success-pill {
  display: flex;
  align-items: center;
  background-color: black;
  color: lightgray;
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
  border: 2px solid lightgray;
  border-radius: 3px;
  background-color: black;
  cursor: pointer;
}

.pill-checkbox:checked {
  background-color: white;
  border-color: white;
}

.pill-checkbox:checked::after {
  content: '✔';
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
