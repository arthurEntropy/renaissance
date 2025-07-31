<template>
  <div class="engagement-dice-table">

    <!-- Header Row -->
    <div class="engagement-dice-header">
      <div class="header-left">
        <h2>Engagement</h2>
        <button class="edit-mode-button" @click="toggleEditMode"
          :title="isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'">
          {{ isEditMode ? '✓' : '✎' }}
        </button>
      </div>
      <div class="button-group">
        <button class="reset-button" :class="{ 'active': hasExpendedDice && !isEditMode }"
          :disabled="isEditMode || !hasExpendedDice" @click="resetDice">
          Reset
        </button>
        <button class="roll-button" :class="{ 'active': !isEditMode }" :disabled="isEditMode" @click="rollSelectedDice">
          Roll
        </button>
      </div>
    </div>

    <!-- Engagement Roll Modal -->
    <EngagementRollModal v-if="showEngagementRollModal" :character="character" :selectedDice="currentRollDice"
      :allEngagementSuccesses="allEngagementSuccesses" :allEquipment="allEquipment" @close="closeEngagementRollModal"
      @engagement-committed="handleEngagementCommitted" @engagement-results="handleEngagementResults" />

    <div class="engagement-dice-content">
      <div v-if="allOwnedEngagementDice.length > 0 || isEditMode" class="dice-display">
        <!-- Display dice -->
        <div v-for="(diceInfo) in allOwnedEngagementDice" :key="diceInfo.statusKey" class="dice-icon-container"
          :class="{ 'user-added-die': diceInfo.isUserAdded }">
          <!-- Remove button for user-added dice in edit mode -->
          <button v-if="isEditMode && diceInfo.isUserAdded" class="remove-die-button"
            @click="removeUserAddedDie(diceInfo.userAddedIndex)">
            ✕
          </button>

          <!-- The die itself -->
          <span class="dice-icon" :class="diceInfo.status" @click="toggleDiceStatus(diceInfo)"
            @mouseenter="startDiceTooltip(diceInfo, $event)" @mouseleave="clearDiceTooltip">
            <i :class="getDiceFontMaxClass(diceInfo.die)"></i>
          </span>
        </div>

        <!-- Add button in edit mode -->
        <div v-if="isEditMode" class="add-die-container">
          <button class="add-die-button" @click="toggleDiceDropdown($event)">+</button>
        </div>
      </div>
      <div v-else-if="!isEditMode" class="no-dice-message">
        No engagement dice available
      </div>

      <!-- Dice dropdown for adding custom dice -->
      <div v-if="showDiceDropdown" class="dice-dropdown"
        :style="{ top: dropdownPosition.y + 'px', left: dropdownPosition.x + 'px' }">
        <button v-for="die in diceOptions" :key="die" class="die-option" @click="addUserAddedDie(die)">
          d{{ die }}
        </button>
      </div>
    </div>

    <!-- Engagement Successes Section -->
    <div class="engagement-successes-section">
      <div class="engagement-successes">
        <!-- Show existing successes -->
        <!-- Show existing successes -->
        <div v-for="success in allOwnedEngagementSuccesses" :key="success.id" class="engagement-success-pill-container"
          :class="{ 'user-added-success': success.isUserAdded }">
          <!-- Remove button for user-added successes in edit mode -->
          <button v-if="isEditMode && success.isUserAdded" class="remove-success-button"
            @click="removeUserAddedSuccess(success.id)">
            ✕
          </button>

          <span class="engagement-success-pill" @mouseenter="startSuccessTooltip(success, $event)"
            @mouseleave="clearSuccessTooltip">
            {{ success.name }}
          </span>
        </div>

        <!-- Add button in edit mode -->
        <div v-if="isEditMode" class="add-success-container">
          <button class="add-success-button" @click="toggleSuccessDropdown($event)">+</button>
        </div>
      </div>

      <!-- No successes message -->
      <div v-if="allOwnedEngagementSuccesses.length === 0 && !isEditMode" class="no-successes-message">
        No engagement successes available
      </div>
    </div>

    <!-- Success dropdown for adding custom successes -->
    <div v-if="showSuccessDropdown" class="success-dropdown"
      :style="{ top: dropdownPosition.y + 'px', left: dropdownPosition.x + 'px' }">
      <!-- Only show available successes that can be added -->
      <div v-if="availableEngagementSuccesses.length > 0">
        <button v-for="success in availableEngagementSuccesses" :key="success.id" class="success-option"
          @click="addUserAddedSuccess(success.id)">
          {{ success.name }}
        </button>
      </div>

      <div v-else class="success-dropdown-empty">
        All engagement successes already owned
      </div>
    </div>

    <!-- Tooltip for engagement success descriptions -->
    <div v-if="tooltipSuccess" class="success-tooltip"
      :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }">
      <div class="tooltip-description">{{ tooltipSuccess.description }}</div>
      <div v-if="tooltipSuccess.sources && tooltipSuccess.sources.length > 0" class="tooltip-source">
        From: {{ tooltipSuccess.sources.join(', ') }}
      </div>
    </div>

    <!-- Tooltip for dice sources -->
    <div v-if="tooltipDice" class="dice-tooltip"
      :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }">
      <div class="tooltip-source">
        From: {{ tooltipDice.name }}
      </div>
    </div>
  </div>
</template>

<script>
import EngagementRollModal from '@/components/modals/EngagementRollModal.vue';
import { getDiceFontMaxClass } from '../../../utils/diceFontUtils'
import { useEngagementDice } from '@/composables/useEngagementDice'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { ref, toRef } from 'vue'

export default {
  components: {
    EngagementRollModal
  },
  props: {
    character: {
      type: Object,
      required: true,
    },
    allEquipment: {
      type: Array,
      default: () => [],
    },
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

  emits: ['update:character', 'engagement-results'],

  setup(props, { emit }) {
    // Initialize composable with reactive references
    const characterRef = toRef(props, 'character')
    const allEquipmentRef = toRef(props, 'allEquipment')

    const diceManager = useEngagementDice(characterRef, allEquipmentRef)
    const successManager = useEngagementSuccesses(characterRef, allEquipmentRef)

    // Local UI state
    const tooltipSuccess = ref(null)
    const tooltipDice = ref(null)
    const tooltipPosition = ref({ x: 0, y: 0 })
    const tooltipTimer = ref(null)
    const isEditMode = ref(false)
    const showDiceDropdown = ref(false)
    const showSuccessDropdown = ref(false)
    const dropdownPosition = ref({ x: 0, y: 0 })
    const diceOptions = ref([4, 6, 8, 10, 12, 20]) // Standard dice types
    const showEngagementRollModal = ref(false)
    const currentRollDice = ref([])

    // Methods
    const updateCharacter = (updatedCharacter) => {
      emit('update:character', updatedCharacter)
    }

    const startSuccessTooltip = (success, event) => {
      clearDiceTooltip() // Ensure only one tooltip shows at a time
      tooltipTimer.value = setTimeout(() => {
        tooltipSuccess.value = success
        tooltipPosition.value = {
          x: event.clientX + 12,
          y: event.clientY + 12,
        }
      }, 1000)
    }

    const clearSuccessTooltip = () => {
      clearTimeout(tooltipTimer.value)
      tooltipSuccess.value = null
    }

    const startDiceTooltip = (diceInfo, event) => {
      clearSuccessTooltip() // Ensure only one tooltip shows at a time
      tooltipTimer.value = setTimeout(() => {
        tooltipDice.value = diceInfo
        tooltipPosition.value = {
          x: event.clientX + 12,
          y: event.clientY + 12,
        }
      }, 1000)
    }

    const clearDiceTooltip = () => {
      clearTimeout(tooltipTimer.value)
      tooltipDice.value = null
    }

    const rollSelectedDice = () => {
      const selectedDice = [...diceManager.selectedDiceValues.value] // Create a copy

      if (selectedDice.length === 0) {
        // Players can choose to enter engagement with no dice selected
        // We just need to confirm this action
        if (!confirm('Enter engagement with no dice selected?')) {
          return
        }
      }

      // Store the selected dice in a data property so they don't change
      currentRollDice.value = selectedDice

      // Show the engagement roll modal with current roll dice
      showEngagementRollModal.value = true
    }

    const closeEngagementRollModal = () => {
      showEngagementRollModal.value = false
    }

    const handleEngagementCommitted = () => {
      // Mark all selected dice as expended when the engagement is actually committed
      // (i.e., when an opponent joined and dice were actually rolled)
      diceManager.markSelectedDiceAsExpended()
    }

    const handleEngagementResults = (engagementResult) => {
      // Pass the engagement results up to the parent component
      emit('engagement-results', engagementResult)
    }

    const toggleEditMode = () => {
      isEditMode.value = !isEditMode.value
      showDiceDropdown.value = false // Close dropdowns when toggling edit mode
      showSuccessDropdown.value = false
    }

    const toggleDiceDropdown = (event) => {
      showDiceDropdown.value = !showDiceDropdown.value
      showSuccessDropdown.value = false // Close success dropdown if open

      if (showDiceDropdown.value) {
        // Default position
        dropdownPosition.value = {
          x: event.clientX,
          y: event.clientY + 10
        }

        // Add click outside listener to close dropdown
        setTimeout(() => {
          // Adjust position if dropdown would go off-screen
          adjustDropdownPosition('.dice-dropdown')
          document.addEventListener('click', closeDiceDropdown)
        }, 10)
      } else {
        document.removeEventListener('click', closeDiceDropdown)
      }
    }

    const closeDiceDropdown = (event) => {
      // Check if click is outside dropdown
      const dropdown = document.querySelector('.dice-dropdown')
      const addButton = document.querySelector('.add-die-button')

      if (dropdown && !dropdown.contains(event.target) &&
        addButton && !addButton.contains(event.target)) {
        showDiceDropdown.value = false
        document.removeEventListener('click', closeDiceDropdown)
      }
    }

    const addUserAddedDie = (die) => {
      diceManager.addUserAddedDie(die, updateCharacter)
      showDiceDropdown.value = false
    }

    const removeUserAddedDie = (index) => {
      diceManager.removeUserAddedDie(index, updateCharacter)
    }

    const toggleSuccessDropdown = (event) => {
      showSuccessDropdown.value = !showSuccessDropdown.value
      showDiceDropdown.value = false // Close dice dropdown if open

      if (showSuccessDropdown.value) {
        dropdownPosition.value = {
          x: event.clientX,
          y: event.clientY + 10
        }

        // Add click outside listener to close dropdown
        setTimeout(() => {
          // Adjust position if dropdown would go off-screen
          adjustDropdownPosition('.success-dropdown')
          document.addEventListener('click', closeSuccessDropdown)
        }, 10)
      } else {
        document.removeEventListener('click', closeSuccessDropdown)
      }
    }

    // TODO: Centralize dropdown position adjustment
    const adjustDropdownPosition = (selector) => {
      const dropdown = document.querySelector(selector)
      if (!dropdown) return

      const dropdownRect = dropdown.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth

      // Check if dropdown extends beyond bottom of viewport
      if (dropdownRect.bottom > windowHeight) {
        // Position above the click point instead of below it
        dropdownPosition.value.y = Math.max(10, dropdownPosition.value.y - dropdownRect.height - 30)
      }

      // Check if dropdown extends beyond right edge of viewport
      if (dropdownRect.right > windowWidth) {
        dropdownPosition.value.x = Math.max(10, dropdownPosition.value.x - (dropdownRect.right - windowWidth) - 20)
      }
    }

    const closeSuccessDropdown = (event) => {
      // Check if click is outside dropdown
      const dropdown = document.querySelector('.success-dropdown')
      const addButton = document.querySelector('.add-success-button')

      if (dropdown && !dropdown.contains(event.target) &&
        addButton && !addButton.contains(event.target)) {
        showSuccessDropdown.value = false
        document.removeEventListener('click', closeSuccessDropdown)
      }
    }

    const addUserAddedSuccess = (successId) => {
      successManager.addUserAddedSuccess(successId, updateCharacter)
      showSuccessDropdown.value = false
    }

    const removeUserAddedSuccess = (successId) => {
      successManager.removeUserAddedSuccess(successId, updateCharacter)
    }

    // Initialize success data
    successManager.fetchEngagementSuccesses()

    return {
      // From dice manager composable
      allOwnedEngagementDice: diceManager.allOwnedEngagementDice,
      hasSelectedDice: diceManager.hasSelectedDice,
      hasExpendedDice: diceManager.hasExpendedDice,
      selectedDiceValues: diceManager.selectedDiceValues,
      toggleDiceStatus: diceManager.toggleDiceStatus,
      resetDice: diceManager.resetDice,

      // From success manager composable
      allEngagementSuccesses: successManager.allEngagementSuccesses,
      allOwnedEngagementSuccesses: successManager.allOwnedEngagementSuccesses,
      availableEngagementSuccesses: successManager.availableEngagementSuccesses,

      // Local state
      tooltipSuccess,
      tooltipDice,
      tooltipPosition,
      tooltipTimer,
      isEditMode,
      showDiceDropdown,
      showSuccessDropdown,
      dropdownPosition,
      diceOptions,
      showEngagementRollModal,
      currentRollDice,

      // Methods
      getDiceFontMaxClass,
      startSuccessTooltip,
      clearSuccessTooltip,
      startDiceTooltip,
      clearDiceTooltip,
      rollSelectedDice,
      closeEngagementRollModal,
      handleEngagementCommitted,
      handleEngagementResults,
      toggleEditMode,
      toggleDiceDropdown,
      closeDiceDropdown,
      addUserAddedDie,
      removeUserAddedDie,
      toggleSuccessDropdown,
      adjustDropdownPosition,
      closeSuccessDropdown,
      addUserAddedSuccess,
      removeUserAddedSuccess
    }
  }
}
</script>

<style scoped>
.engagement-dice-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: black;
  padding: 15px;
  border-radius: 5px;
}

.engagement-dice-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-mode-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-mode-button:hover {
  color: white;
}

.button-group {
  display: flex;
  gap: 8px;
}

.engagement-dice-content {
  width: 100%;
}

.dice-display {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 15px;
}

.dice-icon-container {
  position: relative;
}

.dice-icon {
  font-size: 36px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: inline-block;
}

.remove-die-button {
  position: absolute;
  top: -2px;
  left: -2px;
  width: 16px;
  height: 16px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  padding: 0;
}

.add-die-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
}

.add-die-button {
  width: 26px;
  height: 26px;
  background-color: #444;
  color: white;
  border: 2px solid #666;
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 5px;
  padding-top: 5px;
  padding-left: 7px;
}

.add-die-button:hover {
  background-color: #555;
}

.dice-dropdown {
  position: fixed;
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 5px;
  z-index: 100;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.die-option {
  padding: 5px 10px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
}

.die-option:hover {
  background-color: #555;
}

.dice-icon.available {
  color: inherit;
}

.dice-icon.selected {
  color: gold;
  text-shadow:
    0 0 5px rgba(255, 215, 0, 0.7),
    0 0 10px rgba(255, 215, 0, 0.5),
    0 0 15px rgba(255, 215, 0, 0.3);
  transform: scale(1.05);
}

.dice-icon.expended {
  color: #5a5a5a;
  opacity: 0.7;
}

.dice-icon.expended::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background-color: rgba(255, 0, 0, 0.8);
  transform: translateY(-50%) rotate(-45deg);
  pointer-events: none;
  z-index: 1;
}

.no-dice-message {
  text-align: center;
  color: #999;
  margin-top: 10px;
}

.engagement-successes-section {
  margin-top: 10px;
}

.engagement-successes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
}

.engagement-success-pill-container {
  position: relative;
}

.engagement-success-pill {
  background-color: rgb(61, 61, 61);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 10px;
  text-align: center;
  cursor: help;
  transition: background-color 0.2s;
  display: inline-block;
}

.engagement-success-pill:hover {
  background-color: rgba(64, 64, 64, 0.4);
}

.remove-success-button {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 14px;
  height: 14px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 8px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  padding: 0;
}

.add-success-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 5px;
}

.add-success-button {
  width: 20px;
  height: 20px;
  background-color: #444;
  color: white;
  border: 1px solid #666;
  border-radius: 50%;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  padding-bottom: 2px;
}

.add-success-button:hover {
  background-color: #555;
}

.success-dropdown {
  position: fixed;
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px;
  z-index: 100;
  max-width: 250px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.success-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 5px 8px;
  margin-bottom: 3px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  transition: background-color 0.2s;
}

.success-option:hover {
  background-color: #555;
}

.success-dropdown-empty {
  color: #777;
  font-style: italic;
  padding: 5px;
  text-align: center;
  font-size: 11px;
}

.no-successes-message {
  text-align: center;
  color: #999;
  margin-top: 5px;
  font-size: 11px;
}

.success-tooltip,
.dice-tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(30, 30, 30, 0.97);
  color: #fff;
  padding: 14px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  max-width: 260px;
  white-space: pre-line;
}

.tooltip-description {
  margin-bottom: 8px;
}

.tooltip-source {
  color: #aaa;
  font-size: 10px;
  font-style: italic;
}

h2 {
  margin: 0;
  margin-bottom: 5px;
}

.roll-button,
.reset-button {
  background-color: #333;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.roll-button:disabled,
.reset-button:disabled {
  background-color: #222;
  color: #666;
  cursor: not-allowed;
}

.roll-button.active {
  background-color: gold;
  color: black;
}

.reset-button.active {
  background-color: #777;
  color: white;
}

/* Responsive styles */
@media (max-width: 600px) {
  .engagement-dice-table {
    width: 90%;
    padding: 10px;
  }
}
</style>
