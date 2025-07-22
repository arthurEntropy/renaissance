<template>
  <div class="engagement-dice-table">
    <div class="engagement-dice-header">
      <h2>Engagement</h2>
      <div class="button-group">
        <button class="reset-button" :class="{ 'active': hasExpendedDice }" :disabled="!hasExpendedDice"
          @click="resetDice">
          Reset
        </button>
        <button class="roll-button" :class="{ 'active': hasSelectedDice }" :disabled="!hasSelectedDice"
          @click="rollSelectedDice">
          Roll
        </button>
      </div>
    </div>

    <div class="engagement-dice-content">
      <div v-if="diceSourceInfo.length > 0" class="dice-display">
        <span v-for="(diceInfo) in diceSourceInfo" :key="diceInfo.statusKey" class="dice-icon" :class="diceInfo.status"
          @click="toggleDiceStatus(diceInfo)" :title="`${diceInfo.name}: d${diceInfo.die} (${diceInfo.status})`">
          <i :class="`df-d${diceInfo.die}-${diceInfo.die}`"></i>
        </span>
      </div>
      <div v-else class="no-dice-message">
        No engagement dice available
      </div>
    </div>

    <!-- Engagement Successes Section -->
    <div v-if="uniqueEngagementSuccesses.length > 0" class="engagement-successes-section">
      <div class="engagement-successes">
        <span v-for="success in uniqueEngagementSuccesses" :key="success.id" class="engagement-success-pill"
          @mouseenter="startSuccessTooltip(success, $event)" @mouseleave="clearSuccessTooltip">
          {{ success.name }}
        </span>
      </div>
    </div>

    <!-- Tooltip for engagement success descriptions -->
    <div v-if="tooltipSuccess" class="success-tooltip"
      :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }">
      {{ tooltipSuccess.description }}
    </div>
  </div>
</template>

<script>
import EngagementSuccessService from '@/services/EngagementSuccessService';
import DiceService from '@/services/DiceService'

export default {
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

  data() {
    return {
      allEngagementSuccesses: [],
      tooltipSuccess: null,
      tooltipPosition: { x: 0, y: 0 },
      tooltipTimer: null,
      diceStatuses: {} // Track statuses as { "equipmentId_dieIndex": "available"|"selected"|"expended" }
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

    equipmentWithDice() {
      const result = [];
      if (!this.character || !this.character.equipment || !this.allEquipment) {
        return result;
      }
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
              status
            });
          });
        }
      });
      return result;
    },

    characterEngagementDice() {
      return this.equipmentWithDice
        .map(item => item.die)
        .sort((a, b) => b - a);
    },

    diceSourceInfo() {
      return [...this.equipmentWithDice].sort((a, b) => b.die - a.die);
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

    uniqueEngagementSuccesses() {
      const uniqueIds = [...new Set(this.allEquipmentEngagementSuccesses)];
      return uniqueIds
        .map(id => this.allEngagementSuccesses.find(success => success.id === id))
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
        console.warn('No engagement dice to roll')
        return
      }

      // Roll the dice using the DiceService
      DiceService.rollEngagementDice(
        dice,
        this.character.name,
        this.wieldedWeapons.length > 0
          ? this.getWieldedWeaponName()
          : 'unarmed'
      )
    },

    getWieldedWeaponName() {
      if (this.wieldedWeapons.length === 0) return 'unarmed'

      const weaponId = this.wieldedWeapons[0].id
      const weapon = this.allEquipment.find((eq) => eq.id === weaponId)
      return weapon ? weapon.name : 'unknown weapon'
    },

    startSuccessTooltip(success, event) {
      this.tooltipTimer = setTimeout(() => {
        this.tooltipSuccess = success;
        this.tooltipPosition = {
          x: event.clientX + 12,
          y: event.clientY + 12,
        };
      }, 500);
    },

    clearSuccessTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipSuccess = null;
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
      const selectedDice = this.selectedDice;

      if (selectedDice.length === 0) {
        console.warn('No selected dice to roll');
        return;
      }

      // TODO: Implement dice rolling functionality with DiceService
      // Will need to call a method like:
      // DiceService.rollEngagementDice(selectedDice, this.character.name, weaponName);
      console.log('Rolling selected dice:', selectedDice);

      // Set all selected dice to expended after rolling
      const updatedStatuses = { ...this.diceStatuses };
      Object.keys(updatedStatuses).forEach(key => {
        if (updatedStatuses[key] === 'selected') {
          updatedStatuses[key] = 'expended';
        }
      });
      this.diceStatuses = updatedStatuses;
    },

    resetDice() {
      if (!this.hasExpendedDice) {
        return;
      }

      // Reset all dice to available state
      this.diceStatuses = {};
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
  gap: 3px;
  margin-top: 5px;
}

.dice-icon {
  font-size: 36px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
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

.engagement-success-pill {
  background-color: rgb(61, 61, 61);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 10px;
  text-align: center;
  cursor: help;
  transition: background-color 0.2s;
}

.engagement-success-pill:hover {
  background-color: rgba(64, 64, 64, 0.4);
}

.success-tooltip {
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
