<template>
  <div class="engagement-dice-table">

    <!-- Header Row -->
    <div class="engagement-dice-header edit-trigger">
      <div class="header-left">
        <h2>Engagement</h2>
        <EditButton size="small" visibility="on-hover" :is-edit-mode="isEditMode" @click="toggleEditMode" />
      </div>
      <div class="button-group">
        <ActionButton variant="neutral" size="medium" text="Reset" :disabled="isEditMode || !hasExpendedDice"
          @click="resetDice" />
        <ActionButton variant="primary" size="medium" text="Roll" :disabled="isEditMode" @click="rollSelectedDice" />
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
    <SuccessTooltip v-if="tooltipSuccess" :success="tooltipSuccess" :position="tooltipPosition" />

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
import SuccessTooltip from '@/components/engagement/SuccessTooltip.vue';
import EditButton from '@/components/EditButton.vue';
import ActionButton from '@/components/ActionButton.vue';
import { getDiceFontMaxClass } from '../../../utils/diceFontUtils'
import { useEngagementDice } from '@/composables/useEngagementDice'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { useTooltip } from '@/composables/useTooltip'
import { useDropdown } from '@/composables/useDropdown'
import { ref, toRef, computed } from 'vue'

export default {
  components: {
    EngagementRollModal,
    SuccessTooltip,
    EditButton,
    ActionButton
  },
  props: {
    character: {
      type: Object,
      required: true,
    },
    allEquipment: {
      type: Array,
      default: () => [],
    }
  },

  emits: ['update:character', 'engagement-results'],

  setup(props, { emit }) {
    // Initialize composable with reactive references
    const characterRef = toRef(props, 'character')
    const allEquipmentRef = toRef(props, 'allEquipment')

    const diceManager = useEngagementDice(characterRef, allEquipmentRef)
    const successManager = useEngagementSuccesses(characterRef, allEquipmentRef)

    // UI composables
    const tooltip = useTooltip()
    const diceDropdown = useDropdown()
    const successDropdown = useDropdown()

    // Local UI state
    const isEditMode = ref(false)
    const diceOptions = ref([4, 6, 8, 10, 12, 20]) // Standard dice types
    const showEngagementRollModal = ref(false)
    const currentRollDice = ref([])

    // Computed properties for tooltip data
    const tooltipSuccess = computed(() => tooltip.getTooltip('success'))
    const tooltipDice = computed(() => tooltip.getTooltip('dice'))

    // Methods
    const updateCharacter = (updatedCharacter) => {
      emit('update:character', updatedCharacter)
    }

    const startSuccessTooltip = (success, event) => {
      tooltip.startTooltip('success', success, event)
    }

    const clearSuccessTooltip = () => {
      tooltip.clearTooltip('success')
    }

    const startDiceTooltip = (diceInfo, event) => {
      tooltip.startTooltip('dice', diceInfo, event)
    }

    const clearDiceTooltip = () => {
      tooltip.clearTooltip('dice')
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
      diceDropdown.close() // Close dropdowns when toggling edit mode
      successDropdown.close()
    }

    const toggleDiceDropdown = (event) => {
      successDropdown.close() // Close success dropdown if open
      diceDropdown.toggle(event, '.dice-dropdown', '.add-die-button')
    }

    const addUserAddedDie = (die) => {
      diceManager.addUserAddedDie(die, updateCharacter)
      diceDropdown.close()
    }

    const removeUserAddedDie = (index) => {
      diceManager.removeUserAddedDie(index, updateCharacter)
    }

    const toggleSuccessDropdown = (event) => {
      diceDropdown.close() // Close dice dropdown if open
      successDropdown.toggle(event, '.success-dropdown', '.add-success-button')
    }

    const addUserAddedSuccess = (successId) => {
      successManager.addUserAddedSuccess(successId, updateCharacter)
      successDropdown.close()
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
      tooltipPosition: tooltip.position,
      isEditMode,
      showDiceDropdown: diceDropdown.isOpen,
      showSuccessDropdown: successDropdown.isOpen,
      dropdownPosition: diceDropdown.position,
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
      addUserAddedDie,
      removeUserAddedDie,
      toggleSuccessDropdown,
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
  background-color: var(--color-black);
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
  font-size: var(--font-size-36);
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
  background-color: var(--color-danger);
  color: var(--color-text-primary);
  border: none;
  border-radius: 50%;
  font-size: var(--font-size-10);
  line-height: var(--line-height-none);
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
  background-color: var(--color-gray-medium);
  color: var(--color-text-primary);
  border: 2px solid var(--color-gray-light);
  border-radius: 50%;
  font-size: var(--font-size-18);
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
  background-color: var(--color-gray-light);
}

.dice-dropdown {
  position: fixed;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-gray-light);
  border-radius: 4px;
  padding: 5px;
  z-index: 100;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  box-shadow: 0 2px 8px var(--overlay-black-medium);
}

.die-option {
  padding: 5px 10px;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
}

.die-option:hover {
  background-color: var(--color-bg-secondary);
}

.dice-icon.available {
  color: inherit;
}

.dice-icon.selected {
  color: var(--color-accent-gold);
  text-shadow: var(--shadow-glow-gold);
  transform: scale(1.05);
}

.dice-icon.expended {
  color: var(--color-gray-medium);
  opacity: 0.7;
}

.dice-icon.expended::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-danger);
  transform: translateY(-50%) rotate(-45deg);
  pointer-events: none;
  z-index: 1;
}

.no-dice-message {
  text-align: center;
  color: var(--color-text-muted);
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
  background-color: var(--color-gray-dark);
  color: var(--color-text-primary);
  padding: 5px 10px;
  border-radius: 15px;
  font-size: var(--font-size-10);
  text-align: center;
  cursor: help;
  transition: background-color 0.2s;
  display: inline-block;
}

.engagement-success-pill:hover {
  background-color: var(--color-bg-secondary);
}

.remove-success-button {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 14px;
  height: 14px;
  background-color: var(--color-danger);
  color: var(--color-text-primary);
  border: none;
  border-radius: 50%;
  font-size: var(--font-size-10);
  line-height: var(--line-height-none);
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
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gray-light);
  border-radius: 50%;
  font-size: var(--font-size-14);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  padding-bottom: 2px;
}

.add-success-button:hover {
  background-color: var(--color-bg-secondary);
}

.success-dropdown {
  position: fixed;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-gray-light);
  border-radius: 4px;
  padding: 8px;
  z-index: 100;
  max-width: 250px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 8px var(--overlay-black-medium);
}

.success-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 5px 8px;
  margin-bottom: 3px;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-14);
  transition: background-color 0.2s;
}

.success-option:hover {
  background-color: var(--color-bg-secondary);
}

.success-dropdown-empty {
  color: var(--color-text-muted);
  font-style: italic;
  padding: 5px;
  text-align: center;
  font-size: var(--font-size-14);
}

.no-successes-message {
  text-align: center;
  color: var(--color-text-muted);
  margin-top: 5px;
  font-size: var(--font-size-14);
}

.dice-tooltip {
  position: fixed;
  z-index: 1000;
  background: var(--overlay-black-heavy);
  color: var(--color-text-primary);
  padding: 14px;
  border-radius: 8px;
  font-size: var(--font-size-14);
  pointer-events: none;
  box-shadow: 0 2px 12px var(--overlay-black-medium);
  max-width: 260px;
  white-space: pre-line;
}

.tooltip-source {
  color: var(--color-text-muted);
  font-size: var(--font-size-10);
  font-style: italic;
}

h2 {
  margin: 0;
  margin-bottom: 5px;
}

/* Responsive styles */
@media (max-width: 600px) {
  .engagement-dice-table {
    width: 90%;
    padding: 10px;
  }
}
</style>
