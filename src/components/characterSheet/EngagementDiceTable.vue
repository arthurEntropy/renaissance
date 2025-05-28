<template>
  <div class="engagement-dice-table">
    <h2>Engagement</h2>

    <div class="engagement-dice-container">
      <div class="dice-section">
        <div class="dice-icons">
          <span v-for="die in combinedEngagementDice" :key="'engagement-' + die" class="dice-icon">
            <i :class="getDiceFontClass(die)"></i>
          </span>
        </div>
      </div>
    </div>
    <button class="roll-button" @click="rollEngagementDice" title="Roll engagement dice">
      Roll
    </button>
  </div>
</template>

<script>
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

  computed: {
    wieldedWeapons() {
      return (this.character.equipment || []).filter((item) => {
        if (!item.isWielding) return false

        const equipmentItem = this.allEquipment.find((eq) => eq.id === item.id)
        return equipmentItem && equipmentItem.isMelee
      })
    },

    combinedEngagementDice() {
      return this.calculateEngagementDice()
    },
  },

  methods: {
    getDiceFontClass(die) {
      return `df-d${die}-${die}`
    },

    calculateEngagementDice() {
      // Default dice
      let dice = [6]

      // Add dice from wielded weapons
      if (this.wieldedWeapons.length > 0) {
        this.wieldedWeapons.forEach((item) => {
          const weapon = this.allEquipment.find((eq) => eq.id === item.id)
          if (weapon && weapon.engagementDice) {
            dice = weapon.engagementDice
          }
        })
      }

      // Sort dice for consistency
      return [...dice].sort((a, b) => a - b)
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
  },
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

.engagement-dice-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 10px 0;
}

.dice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
}

.dice-icons {
  display: flex;
  justify-content: center;
  gap: 3px;
}

.dice-icon {
  font-size: 36px;
  /* Size of the dice font */
}

h2 {
  margin: 0;
  margin-bottom: 5px;
}

.roll-button {
  margin-top: 10px;
  background-color: #333;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 6px;
}

.roll-button:hover {
  background-color: #444;
}

/* Media query for smaller screens */
@media (max-width: 600px) {
  .engagement-dice-table {
    width: 90%;
    padding: 10px;
  }
}
</style>
