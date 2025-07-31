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
import EngagementSuccessService from '@/services/EngagementSuccessService';
import EngagementRollModal from '@/components/modals/EngagementRollModal.vue';
import { getDiceFontMaxClass } from '../../../utils/diceFontUtils'
import { DiceStatus } from '../../constants/diceStatus'

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

  data() {
    return {
      allEngagementSuccesses: [],
      tooltipSuccess: null,
      tooltipDice: null,
      tooltipPosition: { x: 0, y: 0 },
      tooltipTimer: null,
      diceStatuses: {},
      isEditMode: false,
      showDiceDropdown: false,
      showSuccessDropdown: false,
      dropdownPosition: { x: 0, y: 0 },
      diceOptions: [4, 6, 8, 10, 12, 20], // Standard dice types
      showEngagementRollModal: false,
      currentRollDice: [],
    };
  },

  computed: {
    equipmentEngagementDice() {
      const result = [];

      if (!this.character?.equipment || !this.allEquipment) {
        return result;
      }

      // Equipment items must be wielded to contribute engagement dice
      const wieldedEquipment = (this.character.equipment || [])
        .filter((item) => item.isWielding)
        .map((item) => this.allEquipment.find((eq) => eq.id === item.id))
        .filter((equipment) => equipment && equipment.engagementDice && equipment.engagementDice.length > 0);

      wieldedEquipment.forEach(equipment => {
        if (equipment.engagementDice) {
          equipment.engagementDice.forEach((die, dieIndex) => {
            const statusKey = `${equipment.id}_${dieIndex}`;
            // Default to available status if not set
            const status = this.diceStatuses[statusKey] || DiceStatus.AVAILABLE;
            result.push({
              die,
              name: equipment.name,
              equipmentId: equipment.id,
              dieIndex,
              statusKey,
              status,
              isUserAdded: false
            });
          });
        }
      });

      return result;
    },

    userAddedEngagementDice() {
      const rawDice = this.character.engagementDice || [];
      return rawDice.map((die, index) => {
        const statusKey = `user_added_${index}`;
        // Default to available status if not set
        const status = this.diceStatuses[statusKey] || DiceStatus.AVAILABLE;
        return {
          die,
          name: 'Added manually', // Label for user-added dice in tooltips
          userAddedIndex: index,
          statusKey,
          status,
          isUserAdded: true
        };
      });
    },

    allOwnedEngagementDice() {
      const allDice = [
        ...this.equipmentEngagementDice,
        ...this.userAddedEngagementDice
      ];

      // Sort by die size for consistent display
      return allDice.sort((a, b) => a.die - b.die);
    },

    hasSelectedDice() {
      return Object.values(this.diceStatuses).includes(DiceStatus.SELECTED);
    },

    selectedDiceValues() {
      return this.allOwnedEngagementDice
        .filter(item => item.status === DiceStatus.SELECTED)
        .map(item => item.die);
    },

    hasExpendedDice() {
      return Object.values(this.diceStatuses).includes(DiceStatus.EXPENDED);
    },

    equipmentEngagementSuccesses() {
      const result = [];

      if (!this.character?.equipment || !this.allEquipment) {
        return result;
      }

      this.character.equipment.forEach(characterEquip => {
        const equipment = this.allEquipment.find(eq => eq.id === characterEquip.id);

        if (characterEquip.isWielding && equipment?.engagementSuccesses?.length > 0) {
          equipment.engagementSuccesses.forEach(successId => {
            const success = this.allEngagementSuccesses.find(s => s.id === successId);
            if (success) {
              result.push({
                ...success,
                isUserAdded: false,
                sources: [equipment.name]
              });
            }
          });
        }
      });

      return result;
    },

    userAddedEngagementSuccesses() {
      const rawSuccessIds = this.character.engagementSuccesses || [];
      return rawSuccessIds.map(successId => {
        const success = this.allEngagementSuccesses.find(s => s.id === successId);
        if (success) {
          return {
            ...success,
            isUserAdded: true,
            sources: ['Added manually'] // Label for user-added successes in tooltips
          };
        }
        return null;
      }).filter(Boolean);
    },

    allOwnedEngagementSuccesses() {
      const allSuccesses = [
        ...this.equipmentEngagementSuccesses,
        ...this.userAddedEngagementSuccesses
      ];

      // Group by ID and merge sources
      const successMap = new Map();

      allSuccesses.forEach(success => {
        if (successMap.has(success.id)) {
          const existing = successMap.get(success.id);
          // Merge sources from all instances
          existing.sources = [...new Set([...existing.sources, ...success.sources])];
          // If any instance is user-added, mark as user-added
          if (success.isUserAdded) {
            existing.isUserAdded = true;
          }
        } else {
          successMap.set(success.id, { ...success });
        }
      });

      // Convert back to array and sort by name
      return Array.from(successMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },

    // Engagement successes available for user to add (not already owned)
    availableEngagementSuccesses() {
      const ownedIds = new Set(this.allOwnedEngagementSuccesses.map(success => success.id));

      return this.allEngagementSuccesses
        .filter(success => !ownedIds.has(success.id))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },

  methods: {
    getDiceFontMaxClass,

    async fetchEngagementSuccesses() {
      try {
        this.allEngagementSuccesses = await EngagementSuccessService.getAllEngagementSuccesses();
      } catch (error) {
        console.error("Error fetching engagement successes:", error);
        this.allEngagementSuccesses = [];
      }
    },

    startSuccessTooltip(success, event) {
      this.clearDiceTooltip(); // Ensure only one tooltip shows at a time
      this.tooltipTimer = setTimeout(() => {
        this.tooltipSuccess = success;
        this.tooltipPosition = {
          x: event.clientX + 12,
          y: event.clientY + 12,
        };
      }, 1000);
    },

    clearSuccessTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipSuccess = null;
    },

    startDiceTooltip(diceInfo, event) {
      this.clearSuccessTooltip(); // Ensure only one tooltip shows at a time
      this.tooltipTimer = setTimeout(() => {
        this.tooltipDice = diceInfo;
        this.tooltipPosition = {
          x: event.clientX + 12,
          y: event.clientY + 12,
        };
      }, 1000);
    },

    clearDiceTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipDice = null;
    },

    toggleDiceStatus(diceInfo) {
      // Cycle through states: available -> selected -> expended -> available
      const currentStatus = this.diceStatuses[diceInfo.statusKey] || DiceStatus.AVAILABLE;
      let newStatus;

      switch (currentStatus) {
        case DiceStatus.AVAILABLE:
          newStatus = DiceStatus.SELECTED;
          break;
        case DiceStatus.SELECTED:
          newStatus = DiceStatus.EXPENDED;
          break;
        case DiceStatus.EXPENDED:
          newStatus = DiceStatus.AVAILABLE;
          break;
        default:
          newStatus = DiceStatus.AVAILABLE;
      }

      this.diceStatuses = {
        ...this.diceStatuses,
        [diceInfo.statusKey]: newStatus
      };
    },

    rollSelectedDice() {
      const selectedDice = [...this.selectedDiceValues]; // Create a copy

      if (selectedDice.length === 0) {
        // Players can choose to enter engagement with no dice selected
        // We just need to confirm this action
        if (!confirm('Enter engagement with no dice selected?')) {
          return;
        }
      }

      // Store the selected dice in a data property so they don't change
      this.currentRollDice = selectedDice;

      // Show the engagement roll modal with current roll dice
      this.showEngagementRollModal = true;
    },

    closeEngagementRollModal() {
      this.showEngagementRollModal = false;
    },

    handleEngagementCommitted() {
      // Mark all selected dice as expended when the engagement is actually committed
      // (i.e., when an opponent joined and dice were actually rolled)
      const updatedStatuses = { ...this.diceStatuses };
      Object.keys(updatedStatuses).forEach(key => {
        if (updatedStatuses[key] === DiceStatus.SELECTED) {
          updatedStatuses[key] = DiceStatus.EXPENDED;
        }
      });
      this.diceStatuses = updatedStatuses;
    },

    handleEngagementResults(engagementResult) {
      // Pass the engagement results up to the parent component
      this.$emit('engagement-results', engagementResult);
    },

    resetDice() {
      if (!this.hasExpendedDice) {
        return;
      }

      // Available is default status
      this.diceStatuses = {};
    },

    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
      this.showDiceDropdown = false; // Close dropdowns when toggling edit mode
      this.showSuccessDropdown = false;
    },

    toggleDiceDropdown(event) {
      this.showDiceDropdown = !this.showDiceDropdown;
      this.showSuccessDropdown = false; // Close success dropdown if open

      if (this.showDiceDropdown) {
        // Default position
        this.dropdownPosition = {
          x: event.clientX,
          y: event.clientY + 10
        };

        // Add click outside listener to close dropdown
        setTimeout(() => {
          // Adjust position if dropdown would go off-screen
          this.adjustDropdownPosition('.dice-dropdown');
          document.addEventListener('click', this.closeDiceDropdown);
        }, 10);
      } else {
        document.removeEventListener('click', this.closeDiceDropdown);
      }
    },

    closeDiceDropdown(event) {
      // Check if click is outside dropdown
      const dropdown = document.querySelector('.dice-dropdown');
      const addButton = document.querySelector('.add-die-button');

      if (dropdown && !dropdown.contains(event.target) &&
        addButton && !addButton.contains(event.target)) {
        this.showDiceDropdown = false;
        document.removeEventListener('click', this.closeDiceDropdown);
      }
    },

    addUserAddedDie(die) {
      const currentDice = this.character.engagementDice || [];
      const updatedDice = [...currentDice, die];

      // Update character with the new user-added dice
      const updatedCharacter = {
        ...this.character,
        engagementDice: updatedDice
      };

      // Emit update event
      this.$emit('update:character', updatedCharacter);

      // Close the dropdown
      this.showDiceDropdown = false;
    },

    removeUserAddedDie(index) {
      const currentDice = this.character.engagementDice || [];
      const updatedDice = currentDice.filter((_, i) => i !== index);

      const updatedCharacter = {
        ...this.character,
        engagementDice: updatedDice
      };

      this.$emit('update:character', updatedCharacter);
    },

    toggleSuccessDropdown(event) {
      this.showSuccessDropdown = !this.showSuccessDropdown;
      this.showDiceDropdown = false; // Close dice dropdown if open

      if (this.showSuccessDropdown) {
        this.dropdownPosition = {
          x: event.clientX,
          y: event.clientY + 10
        };

        // Add click outside listener to close dropdown
        setTimeout(() => {
          // Adjust position if dropdown would go off-screen
          this.adjustDropdownPosition('.success-dropdown');
          document.addEventListener('click', this.closeSuccessDropdown);
        }, 10);
      } else {
        document.removeEventListener('click', this.closeSuccessDropdown);
      }
    },

    // TODO: Centralize dropdown position adjustment
    adjustDropdownPosition(selector) {
      const dropdown = document.querySelector(selector);
      if (!dropdown) return;

      const dropdownRect = dropdown.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Check if dropdown extends beyond bottom of viewport
      if (dropdownRect.bottom > windowHeight) {
        // Position above the click point instead of below it
        this.dropdownPosition.y = Math.max(10, this.dropdownPosition.y - dropdownRect.height - 30);
      }

      // Check if dropdown extends beyond right edge of viewport
      if (dropdownRect.right > windowWidth) {
        this.dropdownPosition.x = Math.max(10, this.dropdownPosition.x - (dropdownRect.right - windowWidth) - 20);
      }
    },

    closeSuccessDropdown(event) {
      // Check if click is outside dropdown
      const dropdown = document.querySelector('.success-dropdown');
      const addButton = document.querySelector('.add-success-button');

      if (dropdown && !dropdown.contains(event.target) &&
        addButton && !addButton.contains(event.target)) {
        this.showSuccessDropdown = false;
        document.removeEventListener('click', this.closeSuccessDropdown);
      }
    },

    addUserAddedSuccess(successId) {
      const currentSuccesses = this.character.engagementSuccesses || [];
      const updatedSuccesses = [...currentSuccesses, successId];

      const updatedCharacter = {
        ...this.character,
        engagementSuccesses: updatedSuccesses
      };

      this.$emit('update:character', updatedCharacter);

      this.showSuccessDropdown = false;
    },

    removeUserAddedSuccess(successId) {
      const currentSuccesses = this.character.engagementSuccesses || [];
      const updatedSuccesses = currentSuccesses.filter(id => id !== successId);

      const updatedCharacter = {
        ...this.character,
        engagementSuccesses: updatedSuccesses
      };

      this.$emit('update:character', updatedCharacter);
    }
  },

  created() {
    this.fetchEngagementSuccesses();
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

.engagement-dice-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 10px 0;
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
