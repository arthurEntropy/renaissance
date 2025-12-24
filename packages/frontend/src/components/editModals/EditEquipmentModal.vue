<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>

      <!-- Header -->
      <h2 class="modal-header centered">Edit Equipment</h2>

      <!-- Scrollable Form Content -->
      <div class="modal-body">
        <form @submit.prevent="saveEquipment">

          <!-- Custom Item Checkbox -->
          <div class="form-group centered">
            <label for="isCustom">
              <input type="checkbox" id="isCustom" v-model="editedEquipment.isCustom" />
              Custom Item
            </label>
          </div>

          <!-- Template Checkbox -->
          <div class="form-group centered">
            <label for="isTemplate">
              <input type="checkbox" id="isTemplate" v-model="editedEquipment.isTemplate" />
              Template
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
              :height="'250px'" :auto-height="true" />
          </div>

          <!-- Equipment Categories -->
          <div class="form-group row equipment-categories">
            <!-- Type Dropdown -->
            <div class="form-column">
              <label for="equipmentType" class="left-aligned">Type:</label>
              <select id="equipmentType" v-model="editedEquipment.type" class="modal-input" @change="onTypeChange">
                <option value="">-- Select Type --</option>
                <option v-for="type in equipmentTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </div>

            <!-- Subtype Dropdown -->
            <div class="form-column">
              <label for="equipmentSubtype" class="left-aligned">Subtype:</label>
              <select id="equipmentSubtype" v-model="editedEquipment.subtype" class="modal-input"
                :disabled="!editedEquipment.type">
                <option value="">-- Select Subtype --</option>
                <option v-for="subtype in availableSubtypes" :key="subtype.id" :value="subtype.id">
                  {{ subtype.name }}
                </option>
              </select>
            </div>

            <!-- Grade Dropdown -->
            <div class="form-column">
              <label for="equipmentGrade" class="left-aligned">Grade:</label>
              <select id="equipmentGrade" v-model="editedEquipment.grade" class="modal-input">
                <option value="">-- Select Grade --</option>
                <option v-for="grade in equipmentGrades" :key="grade.id" :value="grade.id">
                  {{ grade.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group row">

            <!-- Weight -->
            <div class="form-column weight-input">
              <label for="weight" class="left-aligned">Weight:</label>
              <input type="number" id="weight" v-model.number="editedEquipment.weight" min="0" class="modal-input" />
            </div>

            <!-- Length -->
            <div class="form-column weight-input">
              <label for="length" class="left-aligned">Length:</label>
              <input type="number" id="length" v-model.number="editedEquipment.length" min="0" class="modal-input" />
            </div>

            <!-- Reach -->
            <div class="form-column weight-input">
              <label for="reach" class="left-aligned">Reach:</label>
              <input type="number" id="reach" v-model.number="editedEquipment.reach" min="0" class="modal-input" />
            </div>

            <!-- Range -->
            <div class="form-column">
              <label for="range" class="left-aligned">Range:</label>
              <select id="range" v-model="editedEquipment.range" class="modal-input">
                <option value="">-- Select Range --</option>
                <option v-for="range in equipmentRanges" :key="range.id" :value="range.id">
                  {{ range.name }} ({{ range.distance }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-group row">

            <!-- Source -->
            <div class="form-column source-dropdown">
              <label for="source" class="left-aligned">Source:</label>
              <SourceDropdown v-model="editedEquipment.source" id="source" />
            </div>

            <!-- Keeping -->
            <div class="form-column">
              <label for="keeping" class="left-aligned">Keeping:</label>
              <select id="keeping" v-model="editedEquipment.keeping" class="modal-input">
                <option v-for="keeping in keepingOptions" :key="keeping.id" :value="keeping.id">
                  {{ keeping.name }} ({{ keeping.cost }})
                </option>
              </select>
            </div>
          </div>

          <!-- Weapon Properties -->
          <div v-if="equipmentIsWeapon" class="form-group vertical">
            <label>Weapon Properties:</label>
            <div class="properties-inline">
              <label for="twoHanded" class="property-checkbox">
                <input type="checkbox" id="twoHanded" v-model="editedEquipment.twoHanded" />
                Two-Handed
              </label>
              <label for="thrown" class="property-checkbox">
                <input type="checkbox" id="thrown" v-model="editedEquipment.thrown" />
                Thrown
              </label>
              <label for="finesse" class="property-checkbox">
                <input type="checkbox" id="finesse" v-model="editedEquipment.finesse" />
                Finesse
              </label>
              <label for="piercing" class="property-checkbox">
                <input type="checkbox" id="piercing" v-model="editedEquipment.piercing" />
                Piercing
              </label>
            </div>
          </div>

          <!-- Engagement Dice -->
          <div v-if="equipmentIsWeapon" class="form-group vertical">
            <label>Engagement Dice:</label>
            <div class="dice-row">
              <div v-for="dieType in dieTypes" :key="'engagement-' + dieType" class="dice-column">
                <i :class="getDiceFontMaxClass(dieType)" class="dice-icon"></i>
                <input type="number" min="0" v-model.number="engagementDiceCounts[dieType]" class="dice-input" />
              </div>
            </div>
          </div>

          <!-- Damage Dice -->
          <div v-if="equipmentIsWeapon" class="form-group vertical">
            <label>Damage Dice:</label>
            <div class="dice-row">
              <div v-for="dieType in dieTypes" :key="'damage-' + dieType" class="dice-column">
                <i :class="getDiceFontMaxClass(dieType)" class="dice-icon"></i>
                <input type="number" min="0" v-model.number="damageDiceCounts[dieType]" class="dice-input" />
              </div>
            </div>
          </div>

          <!-- Engagement Successes -->
          <div v-if="equipmentIsWeapon" class="form-group vertical">
            <label>Engagement Successes:</label>
            <div class="properties-inline">
              <label v-for="success in engagementSuccessOptions" :key="success.id" :for="'success-' + success.id"
                class="property-checkbox">
                <input type="checkbox" :id="'success-' + success.id" :value="success.id"
                  v-model="editedEquipment.engagementSuccesses" />
                {{ success.name }}
              </label>
            </div>
          </div>

        </form>
      </div>

      <!-- Sticky Action Buttons -->
      <div class="modal-footer">
        <div class="form-buttons">
          <ActionButton variant="success" size="small" text="Save" @click="saveEquipment" type="button" />
          <ActionButton variant="danger" size="small" text="Delete" @click="() => deleteItem('equipment')"
            type="button" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import SourceDropdown from '@/components/ui/selectors/SourceDropdown.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useEditModalForm } from '@/composables/useEditModalForm'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'


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
  keepingOptions: {
    type: Array,
    default: () => [],
  },
  equipmentTypes: {
    type: Array,
    default: () => [],
  },
  equipmentSubtypes: {
    type: Array,
    default: () => [],
  },
  equipmentGrades: {
    type: Array,
    default: () => [],
  },
  equipmentRanges: {
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

// Use edit modal form composable
const { editedData: editedEquipment, hasChanges, save: baseSave, deleteItem, handleOverlayClick } = useEditModalForm(props, emit)

// Dice management - convert between array [4, 6, 6, 8] and count object {4: 1, 6: 2, 8: 1}
const dieTypes = STANDARD_DIE_SIZES
const engagementDiceCounts = ref({})
const damageDiceCounts = ref({})

const convertArrayToCounts = (diceArray) => {
  const counts = {}
  dieTypes.forEach((dieType) => {
    counts[dieType] = diceArray.filter((die) => die === dieType).length
  })
  return counts
}

const convertCountsToArray = (diceCounts) => {
  const diceArray = []
  Object.entries(diceCounts).forEach(([dieType, count]) => {
    for (let i = 0; i < count; i++) {
      diceArray.push(Number(dieType))
    }
  })
  return diceArray
}

// Initialize dice counts from equipment data
engagementDiceCounts.value = convertArrayToCounts(editedEquipment.value?.engagementDice || [])
damageDiceCounts.value = convertArrayToCounts(editedEquipment.value?.damageDice || [])

// Computed properties
const equipmentIsWeapon = computed(() => {
  if (!editedEquipment.value?.type) return false
  const equipmentType = props.equipmentTypes.find(t => t.id === editedEquipment.value.type)
  return equipmentType?.name === 'Weapon'
})

// Equipment categories management
const availableSubtypes = computed(() => {
  if (!editedEquipment.value?.type) return []
  return props.equipmentSubtypes.filter(subtype => subtype.typeId === editedEquipment.value.type)
})

const onTypeChange = () => {
  // Clear subtype when type changes
  editedEquipment.value.subtype = null
}

// Equipment management functions
const saveDiceChanges = () => {
  editedEquipment.value.engagementDice = convertCountsToArray(engagementDiceCounts.value)
  editedEquipment.value.damageDice = convertCountsToArray(damageDiceCounts.value)
}

const saveEquipment = () => {
  if (!editedEquipment.value.id) {
    alert('Cannot save equipment: Missing ID. Please try again or contact support.')
    return
  }
  saveDiceChanges()
  // Ensure numeric values are valid
  editedEquipment.value.weight = Number.isFinite(editedEquipment.value.weight)
    ? editedEquipment.value.weight
    : 0
  editedEquipment.value.length = Number.isFinite(editedEquipment.value.length)
    ? editedEquipment.value.length
    : 0
  editedEquipment.value.reach = Number.isFinite(editedEquipment.value.reach)
    ? editedEquipment.value.reach
    : 0
  baseSave()
}
</script>

<style scoped>
.modal-content {
  width: var(--width-modal);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  height: auto;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--space-md);
}

.modal-footer {
  flex-shrink: 0;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-primary);
  padding: var(--space-md) 0 0 0;
  margin-top: var(--space-md);
}

.modal-footer .form-buttons {
  margin-top: 0;
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.description :deep(.rich-editor-wrapper) {
  width: 98%;
}

.weight-input {
  flex: 0.25;
  margin-right: var(--space-xl);
}

.source-dropdown {
  flex: 1.5;
}

.equipment-categories .form-column:last-child {
  margin-right: 0;
}

.melee-checkbox {
  margin: var(--space-xl) 0;
}

/* Dice styles */
.dice-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

.dice-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.dice-icon {
  font-size: var(--font-size-36);
}

.dice-input {
  width: 50px;
  text-align: center;
  padding: var(--space-xs);
  font-size: var(--font-size-14);
  border: 1px solid var(--color-gray-light);
  border-radius: var(--radius-5);
}

/* Weapon Properties */
.weapon-properties {
  margin: var(--space-md) 0;
}

.properties-header {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.properties-inline {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

.properties-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.property-checkbox {
  display: flex;
  align-items: center;
  font-size: var(--font-size-14);
  color: var(--color-text-primary);
  cursor: pointer;
}

.property-checkbox input[type="checkbox"] {
  margin-right: var(--space-xs);
}
</style>
