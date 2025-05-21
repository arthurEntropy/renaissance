<template>
  <div class="core-ability-column">
    <!-- Core Ability Header -->
    <div class="core-ability-header">
      <h2>{{ columnConfig.title }}</h2>
      <NumberInput
        :model-value="coreAbilityValue"
        @update:model-value="
          updateCharacter(columnConfig.coreAbilityKey, $event)
        "
        :min="0"
        size="large"
      />
    </div>

    <!-- Skills -->
    <div v-for="skill in skills" :key="skill.name" class="skill-row">
      <span
        class="skill-name-clickable"
        @click="$emit('open-skill-check', skill.name)"
      >
        {{ skill.name }}
      </span>
      <i
        class="dice-icon d12-icon"
        :class="[
          getDiceFontClass(12, 12),
          getStyleClassForFavoredStatus(skill),
        ]"
      ></i>
      <div class="dice-group">
        <i
          v-for="(n, diceIndex) in 5"
          :key="diceIndex"
          :class="[
            getDiceFontClass(6, 6),
            {
              'dice-active': isRankActive(skill, diceIndex),
              'dice-added': isDiceAdded(skill, diceIndex),
              'dice-subtracted': isDiceSubtracted(skill, diceIndex),
            },
          ]"
          @click="handleDiceClick(skill.name, diceIndex)"
          class="dice-icon d6-icon"
        ></i>
      </div>
    </div>

    <!-- Virtue Row -->
    <div class="virtue-row">
      <span class="skill-name">{{ columnConfig.virtueLabel }}</span>
      <NumberInput
        :model-value="virtueValue.current"
        @update:model-value="
          updateCharacter(`${columnConfig.virtueKey}.current`, $event)
        "
        :min="0"
        size="small"
      />
      <span>/</span>
      <NumberInput
        :model-value="virtueValue.max"
        @update:model-value="
          updateCharacter(`${columnConfig.virtueKey}.max`, $event)
        "
        :min="0"
        size="small"
      />
    </div>

    <!-- Weakness Row -->
    <div class="weakness-row">
      <span class="skill-name">{{ columnConfig.weaknessLabel }}</span>
      <NumberInput
        :model-value="weaknessValue"
        @update:model-value="updateCharacter(columnConfig.weaknessKey, $event)"
        :min="0"
        size="small"
      />
    </div>

    <!-- State Row -->
    <div class="state-row">
      <span class="skill-name" :class="{ 'state-active': firstStateValue }">{{
        this.$capitalizeFirstLetter(columnConfig.firstStateKey)
      }}</span>
      <input
        type="checkbox"
        :checked="firstStateValue"
        @change="
          updateCharacter(columnConfig.firstStateKey, $event.target.checked)
        "
        class="skill-checkbox"
        :class="{ 'state-active-checkbox': firstStateValue }"
      />
      <input
        type="checkbox"
        :checked="secondStateValue"
        @change="
          updateCharacter(columnConfig.secondStateKey, $event.target.checked)
        "
        class="skill-checkbox"
        :class="{ 'state-active-checkbox': secondStateValue }"
      />
      <span></span>
      <!-- Empty span for alignment -->
      <span></span>
      <!-- Empty span for alignment -->
    </div>
  </div>
</template>

<script>
import CharacterService from '@/services/CharacterService'
import NumberInput from '@/components/NumberInput' // Adjust path as needed

export default {
  components: {
    NumberInput,
  },
  props: {
    character: {
      type: Object,
      required: true,
    },
    column: {
      type: String,
      required: true,
    },
  },
  emits: ['update-character', 'open-skill-check'],
  computed: {
    columnConfig() {
      const columnMappings = {
        body: {
          title: 'BODY',
          coreAbilityKey: 'body',
          virtueLabel: 'Endurance',
          virtueKey: 'endurance',
          weaknessLabel: 'Load',
          weaknessKey: 'load',
          firstStateKey: 'weary',
          secondStateKey: 'twiceWeary',
          skillRange: [0, 5],
        },
        heart: {
          title: 'HEART',
          coreAbilityKey: 'heart',
          virtueLabel: 'Hope',
          virtueKey: 'hope',
          weaknessLabel: 'Shadow',
          weaknessKey: 'shadow',
          firstStateKey: 'miserable',
          secondStateKey: 'twiceMiserable',
          skillRange: [5, 10],
        },
        wits: {
          title: 'WITS',
          coreAbilityKey: 'wits',
          virtueLabel: 'Defense',
          virtueKey: 'defense',
          weaknessLabel: 'Injury',
          weaknessKey: 'injury',
          firstStateKey: 'helpless',
          secondStateKey: 'twiceHelpless',
          skillRange: [10, 15],
        },
      }
      return columnMappings[this.column]
    },
    coreAbilityValue() {
      return this.character[this.columnConfig.coreAbilityKey]
    },
    virtueValue() {
      return this.character[this.columnConfig.virtueKey]
    },
    weaknessValue() {
      return this.character[this.columnConfig.weaknessKey]
    },
    firstStateValue() {
      return this.character.states[this.columnConfig.firstStateKey]
    },
    secondStateValue() {
      return this.character.states[this.columnConfig.secondStateKey]
    },
    skills() {
      const [start, end] = this.columnConfig.skillRange
      return this.character.skills.slice(start, end)
    },
  },
  methods: {
    // Get the dice font class for the specified die type and value
    getDiceFontClass(sides, value) {
      return `df-d${sides}-${value}`
    },

    // Determine if the rank is active (either from base ranks or positive dice mod)
    isRankActive(skill, diceIndex) {
      return this.isCheckboxChecked(skill, diceIndex)
    },

    // Determine if this die is added by a positive dice mod
    isDiceAdded(skill, diceIndex) {
      return (
        diceIndex >= skill.ranks &&
        diceIndex < skill.ranks + skill.diceMod &&
        skill.diceMod > 0
      )
    },

    // Determine if this die is subtracted by a negative dice mod
    isDiceSubtracted(skill, diceIndex) {
      return (
        skill.ranks - diceIndex <= Math.abs(skill.diceMod) &&
        skill.diceMod < 0 &&
        diceIndex < skill.ranks
      )
    },

    // Handle clicks on the dice icons, same logic as checkbox clicks
    handleDiceClick(skillName, diceIndex) {
      this.handleCheckboxChange(skillName, diceIndex)
    },

    // Existing methods remain unchanged
    getStyleClassForFavoredStatus(skill) {
      if (skill.isFavored && !skill.isIllFavored) return 'favored'
      if (skill.isIllFavored && !skill.isFavored) return 'ill-favored'
      return ''
    },

    isCheckboxChecked(skill, checkboxIndex) {
      const withinRanks = checkboxIndex < skill.ranks
      const withinDiceMod =
        checkboxIndex >= skill.ranks &&
        checkboxIndex < skill.ranks + skill.diceMod &&
        skill.diceMod > 0
      return withinRanks || withinDiceMod
    },

    getStyleClassForDiceMod(skill, checkboxIndex) {
      return {
        diceSubtracted:
          skill.ranks - checkboxIndex <= Math.abs(skill.diceMod) &&
          skill.diceMod < 0,
        diceAdded:
          checkboxIndex >= skill.ranks &&
          checkboxIndex < skill.ranks + skill.diceMod &&
          skill.diceMod > 0,
      }
    },

    handleCheckboxChange(skillName, checkboxIndex) {
      const skill = this.character.skills.find((s) => s.name === skillName)
      const newRank = checkboxIndex + 1
      if (newRank === skill.ranks) {
        skill.ranks -= 1
      } else {
        skill.ranks = newRank
      }
      CharacterService.updateFavoredStatus(this.character)
      this.$emit('update-character', this.character)
    },

    updateCharacter(key, value) {
      const keys = key.split('.') // Split the key into parts for nested properties
      let target = this.character

      // Traverse the object to the second-to-last key
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) {
          // Initialize the intermediate object if it doesn't exist
          target[keys[i]] = {}
        }
        target = target[keys[i]]
      }

      // Update the final key
      target[keys[keys.length - 1]] = value

      // Emit the updated character object
      this.$emit('update-character', this.character)
    },
  },
}
</script>

<style scoped>
.core-ability-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  background-color: black;
  border-radius: 5px;
  padding: 15px;
  width: 270px;
  max-width: 270px;
}
.core-ability-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  height: 28px;
  gap: 10px;
}
.skill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 5px 0;
  height: 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
.skill-name-clickable {
  color: rgb(212, 182, 106);
  text-align: left;
  flex: 1;
  max-width: 85px;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}
.skill-name-clickable:hover {
  color: white;
  text-shadow: 0px 0px 5px goldenrod;
}

/* Dice styling */
.dice-icon {
  font-size: 24px;
  cursor: pointer;
  transition:
    color 0.2s,
    opacity 0.2s;
}

.d12-icon {
  margin-left: auto;
  margin-right: 8px;
  width: 25px;
  text-align: center;
  border-radius: 5px;
}

.dice-group {
  display: flex;
  gap: 5px;
  margin: 0 4px;
}

.d6-icon {
  opacity: 0.4;
  color: #888;
}

.dice-active {
  opacity: 1;
  color: white;
}

.dice-added {
  color: lightgreen;
  text-shadow: 0px 0px 5px lightgreen;
}

.dice-subtracted {
  color: red;
  text-shadow: 0px 0px 5px red;
}

.virtue-row,
.weakness-row,
.state-row {
  display: grid;
  align-items: center;
  height: 25px;
  width: 100%;
  margin-top: 10px;
}
.virtue-row {
  grid-template-columns: 35% 19% 8% 19% 19%;
}
.weakness-row {
  grid-template-columns: 35% 65%;
}
.state-row {
  grid-template-columns: 35% 10% 10% 45%;
}

/* CONDITIONAL STYLES */
.favored {
  color: lightgreen;
  text-shadow: 0px 0px 5px lightgreen;
}
.ill-favored {
  color: red;
  text-shadow: 0px 0px 5px red;
}
.state-active {
  color: red;
  text-shadow: 0px 0px 5px red;
}
.state-active-checkbox {
  box-shadow: 0px 0px 10px cyan;
}
</style>
