<template>
  <div class="engagement-dice-table">
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
        <button class="roll-button" :class="{ 'active': hasSelectedDice && !isEditMode }"
          :disabled="isEditMode || !hasSelectedDice" @click="rollSelectedDice">
          Roll
        </button>
      </div>
    </div>

    <!-- Engagement Roll Modal -->
    <EngagementRollModal v-if="showEngagementRollModal" :character="character" :selectedDice="currentRollDice"
      :allEngagementSuccesses="allEngagementSuccesses" :allEquipment="allEquipment" @close="closeEngagementRollModal"
      @confirm-roll="handleConfirmRoll" />

    <div class="engagement-dice-content">
      <div v-if="diceSourceInfo.length > 0 || isEditMode" class="dice-display">
        <!-- Display dice -->
        <div v-for="(diceInfo) in diceSourceInfo" :key="diceInfo.statusKey" class="dice-icon-container"
          :class="{ 'custom-die': diceInfo.isCustom }">
          <!-- Remove button for custom dice in edit mode -->
          <button v-if="isEditMode && diceInfo.isCustom" class="remove-die-button"
            @click="removeCustomDie(diceInfo.customIndex)">
            ✕
          </button>

          <!-- The die itself -->
          <span class="dice-icon" :class="diceInfo.status" @click="toggleDiceStatus(diceInfo)"
            @mouseenter="startDiceTooltip(diceInfo, $event)" @mouseleave="clearDiceTooltip">
            <i :class="`df-d${diceInfo.die}-${diceInfo.die}`"></i>
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
        <button v-for="die in diceOptions" :key="die" class="die-option" @click="addCustomDie(die)">
          d{{ die }}
        </button>
      </div>
    </div>

    <!-- Engagement Successes Section -->
    <div class="engagement-successes-section">
      <div class="engagement-successes">
        <!-- Show existing successes -->
        <div v-for="success in uniqueEngagementSuccesses" :key="success.id" class="engagement-success-pill-container"
          :class="{ 'custom-success': success.isCustom }">
          <!-- Remove button for custom successes in edit mode -->
          <button v-if="isEditMode && success.isCustom" class="remove-success-button"
            @click="removeCustomSuccess(success.id)">
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
      <div v-if="uniqueEngagementSuccesses.length === 0 && !isEditMode" class="no-successes-message">
        No engagement successes available
      </div>
    </div>

    <!-- Success dropdown for adding custom successes -->
    <div v-if="showSuccessDropdown" class="success-dropdown"
      :style="{ top: dropdownPosition.y + 'px', left: dropdownPosition.x + 'px' }">
      <!-- Only show available successes that can be added -->
      <div v-if="availableEngagementSuccesses.length > 0">
        <button v-for="success in availableEngagementSuccesses" :key="success.id" class="success-option"
          @click="addCustomSuccess(success.id)">
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
      <div v-if="successSources[tooltipSuccess.id]" class="tooltip-source">
        From: {{ successSources[tooltipSuccess.id].join(', ') }}
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

  emits: ['update:character'], // Emit event to update character

  data() {
    return {
      allEngagementSuccesses: [],
      tooltipSuccess: null,
      tooltipDice: null,
      tooltipPosition: { x: 0, y: 0 },
      tooltipTimer: null,
      diceStatuses: {}, // Track statuses as { "equipmentId_dieIndex": "available"|"selected"|"expended" }
      isEditMode: false, // Toggle for edit mode
      showDiceDropdown: false, // Toggle for dice dropdown visibility
      showSuccessDropdown: false, // Toggle for success dropdown visibility
      dropdownPosition: { x: 0, y: 0 }, // Position for dropdown
      diceOptions: [4, 6, 8, 10, 12, 20], // Available dice options
      showEngagementRollModal: false, // Toggle for the engagement roll modal
      currentRollDice: [], // Store the currently selected dice for the roll modal
    };
  },

  computed: {
    wieldedWeapons() {
      // Ensure reactivity by referencing character.equipment and allEquipment
      return (this.character.equipment || []).filter((item) => {
        if (!item.isWielding) return false
        const equipmentItem = this.allEquipment.find((eq) => eq.id === item.id)
        return equipmentItem && equipmentItem.isMelee
      })
    },

    combinedEngagementDice() {
      // Default dice
      let dice = [6]
      // Collect all engagement dice from wielded weapons
      if (this.wieldedWeapons.length > 0) {
        dice = this.wieldedWeapons
          .map((item) => {
            const weapon = this.allEquipment.find((eq) => eq.id === item.id)
            return weapon && weapon.engagementDice ? weapon.engagementDice : []
          })
          .flat()
      }
      // Sort dice for consistency
      return [...dice].sort((a, b) => a - b)
    },

    customEngagementDice() {
      // Return the custom engagement dice from character, or an empty array if not defined
      return this.character.engagementDice || [];
    },

    customEngagementSuccesses() {
      // Return the custom engagement successes from character, or an empty array if not defined
      return this.character.engagementSuccesses || [];
    },

    // All available engagement successes that can be added
    availableEngagementSuccesses() {
      // Filter out successes that are already in the character's equipment or custom successes
      return this.allEngagementSuccesses.filter(success => {
        // Check if this success is already in equipment or custom
        const isInEquipment = this.allEquipmentEngagementSuccesses.includes(success.id);
        const isInCustom = this.customEngagementSuccesses.includes(success.id);
        return !isInEquipment && !isInCustom;
      }).sort((a, b) => a.name.localeCompare(b.name));
    },

    // All engagement successes that are already owned but can still be shown in dropdown
    ownedEngagementSuccesses() {
      // Get successes that are already in the character's equipment or custom successes
      return this.allEngagementSuccesses.filter(success => {
        const isInEquipment = this.allEquipmentEngagementSuccesses.includes(success.id);
        const isInCustom = this.customEngagementSuccesses.includes(success.id);
        return isInEquipment || isInCustom;
      }).sort((a, b) => a.name.localeCompare(b.name));
    },

    equipmentWithDice() {
      const result = [];
      if (!this.character || !this.character.equipment || !this.allEquipment) {
        return result;
      }

      // Add dice from equipment
      this.character.equipment.forEach(characterEquip => {
        const fullEquipment = this.allEquipment.find(eq => eq.id === characterEquip.id);
        const isActive = characterEquip.isCarried !== false && characterEquip.isWielding !== false;
        if (isActive && fullEquipment && fullEquipment.engagementDice && fullEquipment.engagementDice.length > 0) {
          fullEquipment.engagementDice.forEach((die, dieIndex) => {
            const statusKey = `${fullEquipment.id}_${dieIndex}`;
            const status = this.diceStatuses[statusKey] || 'available';
            result.push({
              die,
              name: fullEquipment.name,
              equipmentId: fullEquipment.id,
              dieIndex,
              statusKey,
              status,
              isCustom: false
            });
          });
        }
      });

      // Add custom dice
      if (this.customEngagementDice.length > 0) {
        this.customEngagementDice.forEach((die, index) => {
          const statusKey = `custom_${index}`;
          const status = this.diceStatuses[statusKey] || 'available';
          result.push({
            die,
            name: 'Custom',
            customIndex: index,
            statusKey,
            status,
            isCustom: true
          });
        });
      }

      return result;
    },

    characterEngagementDice() {
      return this.equipmentWithDice
        .map(item => item.die)
        .sort((a, b) => b - a);
    },

    diceSourceInfo() {
      return [...this.equipmentWithDice].sort((a, b) => a.die - b.die);
    },

    allEquipmentEngagementSuccesses() {
      const successIds = [];
      if (!this.character || !this.character.equipment || !this.allEquipment) {
        return [];
      }
      this.character.equipment.forEach(characterEquip => {
        const fullEquipment = this.allEquipment.find(eq => eq.id === characterEquip.id);
        const isActive = characterEquip.isCarried !== false && characterEquip.isWielding !== false;
        if (isActive && fullEquipment && fullEquipment.engagementSuccesses && fullEquipment.engagementSuccesses.length > 0) {
          successIds.push(...fullEquipment.engagementSuccesses);
        }
      });
      return successIds;
    },

    // Map success IDs to their source equipment names
    successSources() {
      const sources = {};
      if (!this.character || !this.character.equipment || !this.allEquipment) {
        return sources;
      }

      this.character.equipment.forEach(characterEquip => {
        const fullEquipment = this.allEquipment.find(eq => eq.id === characterEquip.id);
        const isActive = characterEquip.isCarried !== false && characterEquip.isWielding !== false;

        if (isActive && fullEquipment && fullEquipment.engagementSuccesses && fullEquipment.engagementSuccesses.length > 0) {
          fullEquipment.engagementSuccesses.forEach(successId => {
            if (!sources[successId]) {
              sources[successId] = [];
            }
            if (!sources[successId].includes(fullEquipment.name)) {
              sources[successId].push(fullEquipment.name);
            }
          });
        }
      });

      return sources;
    },

    uniqueEngagementSuccesses() {
      // Combine equipment and custom successes
      const allSuccessIds = [
        ...this.allEquipmentEngagementSuccesses,
        ...this.customEngagementSuccesses
      ];
      const uniqueIds = [...new Set(allSuccessIds)];

      return uniqueIds
        .map(id => {
          const success = this.allEngagementSuccesses.find(success => success.id === id);
          if (success) {
            // Add a flag to indicate if this is a custom success
            return {
              ...success,
              isCustom: this.customEngagementSuccesses.includes(id) && !this.allEquipmentEngagementSuccesses.includes(id)
            };
          }
          return null;
        })
        .filter(success => success)
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    hasSelectedDice() {
      return Object.values(this.diceStatuses).includes('selected');
    },

    selectedDice() {
      return this.equipmentWithDice
        .filter(item => item.status === 'selected')
        .map(item => item.die);
    },

    hasExpendedDice() {
      return Object.values(this.diceStatuses).includes('expended');
    }
  },

  methods: {
    async fetchEngagementSuccesses() {
      try {
        this.allEngagementSuccesses = await EngagementSuccessService.getAllEngagementSuccesses();
      } catch (error) {
        console.error("Error fetching engagement successes:", error);
        this.allEngagementSuccesses = [];
      }
    },

    getDiceFontClass(die) {
      return `df-d${die}-${die}`
    },

    rollEngagementDice() {
      const dice = this.combinedEngagementDice

      if (dice.length === 0) {
        return
      }

      // Execute engagement roll with combined dice
    },

    getWieldedWeaponName() {
      if (this.wieldedWeapons.length === 0) return 'unarmed'

      const weaponId = this.wieldedWeapons[0].id
      const weapon = this.allEquipment.find((eq) => eq.id === weaponId)
      return weapon ? weapon.name : 'unknown weapon'
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
      const currentStatus = this.diceStatuses[diceInfo.statusKey] || 'available';
      let newStatus;

      switch (currentStatus) {
        case 'available':
          newStatus = 'selected';
          break;
        case 'selected':
          newStatus = 'expended';
          break;
        case 'expended':
          newStatus = 'available';
          break;
        default:
          newStatus = 'available';
      }

      // In Vue 3, we can directly set properties and they will be reactive
      this.diceStatuses = {
        ...this.diceStatuses,
        [diceInfo.statusKey]: newStatus
      };
    },

    rollSelectedDice() {
      const selectedDice = [...this.selectedDice]; // Create a copy

      if (selectedDice.length === 0) {
        alert('Please select at least one die to roll.');
        return;
      }

      // Store the selected dice in a data property so they don't change
      this.currentRollDice = selectedDice;

      // Show the engagement roll modal with current roll dice
      this.showEngagementRollModal = true;
    },

    closeEngagementRollModal() {
      this.showEngagementRollModal = false;
    },

    handleConfirmRoll() {
      // Set all selected dice to expended after rolling
      const updatedStatuses = { ...this.diceStatuses };
      Object.keys(updatedStatuses).forEach(key => {
        if (updatedStatuses[key] === 'selected') {
          updatedStatuses[key] = 'expended';
        }
      });
      this.diceStatuses = updatedStatuses;

      // Clear the current roll dice
      this.currentRollDice = [];

      // Close the modal
      this.closeEngagementRollModal();
    }, resetDice() {
      if (!this.hasExpendedDice) {
        return;
      }

      // Reset all dice to available state
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

    addCustomDie(die) {
      // Create a new array with the custom dice, adding the new one
      const updatedDice = [...this.customEngagementDice, die];

      // Update character with the new custom dice
      const updatedCharacter = {
        ...this.character,
        engagementDice: updatedDice
      };

      // Emit update event
      this.$emit('update:character', updatedCharacter);

      // Close the dropdown
      this.showDiceDropdown = false;
    },

    removeCustomDie(index) {
      // Create a new array with the custom dice, removing the specified one
      const updatedDice = this.customEngagementDice.filter((_, i) => i !== index);

      // Update character with the new custom dice
      const updatedCharacter = {
        ...this.character,
        engagementDice: updatedDice
      };

      // Emit update event
      this.$emit('update:character', updatedCharacter);
    },

    toggleSuccessDropdown(event) {
      this.showSuccessDropdown = !this.showSuccessDropdown;
      this.showDiceDropdown = false; // Close dice dropdown if open

      if (this.showSuccessDropdown) {
        // Default position
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

    addCustomSuccess(successId) {
      // Create a new array with the custom successes, adding the new one
      const updatedSuccesses = [...this.customEngagementSuccesses, successId];

      // Update character with the new custom successes
      const updatedCharacter = {
        ...this.character,
        engagementSuccesses: updatedSuccesses
      };

      // Emit update event
      this.$emit('update:character', updatedCharacter);

      // Close the dropdown
      this.showSuccessDropdown = false;
    },

    removeCustomSuccess(successId) {
      // Create a new array with the custom successes, removing the specified one
      const updatedSuccesses = this.customEngagementSuccesses.filter(id => id !== successId);

      // Update character with the new custom successes
      const updatedCharacter = {
        ...this.character,
        engagementSuccesses: updatedSuccesses
      };

      // Emit update event
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
  /* Default color */
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
  /* Dark gray */
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

/* Media query for smaller screens */
@media (max-width: 600px) {
  .engagement-dice-table {
    width: 90%;
    padding: 10px;
  }
}
</style>
