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
            <SourceDropdown v-model="editedEquipment.source" id="source" />
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
              <i :class="getDiceFontMaxClass(dieType)" class="dice-icon"></i>
              <input type="number" min="0" v-model.number="engagementDiceCounts[dieType]" class="dice-input" />
            </div>
          </div>
        </div>

        <!-- Damage Dice -->
        <div v-if="editedEquipment.isMelee" class="form-group vertical">
          <label>Damage Dice:</label>
          <div class="dice-row">
            <div v-for="dieType in dieTypes" :key="'damage-' + dieType" class="dice-column">
              <i :class="getDiceFontMaxClass(dieType)" class="dice-icon"></i>
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
          <ActionButton variant="success" size="small" text="Save Changes" @click="saveEquipment" type="button" />
          <ActionButton variant="neutral" size="small" text="Cancel" @click="closeModal" type="button" />
          <ActionButton variant="danger" size="small" text="Delete" @click="deleteEquipment" type="button" />
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { useDiceManagement } from '@/composables/useDiceManagement'
import { useEditForm } from '@/composables/useEditForm'
import TextEditor from '@/components/TextEditor.vue'
import SourceDropdown from '@/components/SourceDropdown.vue'
import ActionButton from '@/components/ActionButton.vue'
import { getDiceFontMaxClass } from '../../../utils/diceFontUtils'

// Props
const props = defineProps({
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
  engagementSuccessOptions: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['update', 'delete', 'close'])

// Composables
const {
  editedData: editedEquipment,
  save,
  deleteItem,
  cancel
} = useEditForm(props.equipment, emit)

// Dice management composables
const {
  dieTypes,
  diceCounts: engagementDiceCounts,
  initializeCounts: initializeEngagementDice,
  getDiceList: getEngagementDiceList
} = useDiceManagement()

const {
  diceCounts: damageDiceCounts,
  initializeCounts: initializeDamageDice,
  getDiceList: getDamageDiceList
} = useDiceManagement()

// Initialize dice counts from equipment data
const initializeDiceCounts = () => {
  initializeEngagementDice(editedEquipment.value?.engagementDice || [])
  initializeDamageDice(editedEquipment.value?.damageDice || [])
}

// Initialize dice counts immediately
initializeDiceCounts()

// Equipment management functions
const saveDiceChanges = () => {
  editedEquipment.value.engagementDice = getEngagementDiceList()
  editedEquipment.value.damageDice = getDamageDiceList()
}

const saveEquipment = () => {
  if (!editedEquipment.value.id) {
    console.error('Cannot save equipment: Missing ID')
    return
  }
  saveDiceChanges()
  // Ensure weight is a valid number
  editedEquipment.value.weight = Number.isFinite(editedEquipment.value.weight)
    ? editedEquipment.value.weight
    : 0
  save()
}

const deleteEquipment = () => deleteItem('equipment')
const closeModal = () => cancel()
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
  border: 1px solid var(--color-gray-light);
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
  background-color: var(--overlay-black-heavy);
  color: var(--color-text-secondary);
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
  border: 2px solid var(--color-gray-light);
  border-radius: 3px;
  background-color: var(--overlay-black-heavy);
  cursor: pointer;
}

.pill-checkbox:checked {
  background-color: var(--color-white);
  border-color: var(--color-white);
}

.pill-checkbox:checked::after {
  content: '✔';
  display: block;
  color: var(--overlay-black-heavy);
  font-size: 12px;
  text-align: center;
  line-height: 16px;
}

.pill-checkbox:hover {
  border-color: var(--color-gray-medium);
}
</style>
