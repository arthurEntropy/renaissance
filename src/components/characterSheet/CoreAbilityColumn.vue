<template>
    <div class="core-ability-column">

      <!-- Core Ability Header -->
      <div class="core-ability-header">
        <h2>{{ columnConfig.title }}</h2>
        <input
          type="number"
          :value="coreAbilityValue"
          @input="updateCharacter(columnConfig.coreAbilityKey, Number($event.target.value))"
          class="input-large"
          min="0"
        />
      </div>
  
      <!-- Skills -->
      <div v-for="(skill) in skills" :key="skill.name" class="skill-row">
        <span class="skill-name-clickable" @click="$emit('open-skill-check', skill.name)">
          {{ skill.name }}
        </span>
        <span class="d12-symbol" :class="getStyleClassForFavoredStatus(skill)">⭓</span>
        <div class="skill-checkbox-group">
          <input
            v-for="(n, checkboxIndex) in 5"
            :key="checkboxIndex"
            type="checkbox"
            :checked="isCheckboxChecked(skill, checkboxIndex)"
            @click="handleCheckboxChange(skill.name, checkboxIndex)"
            class="skill-checkbox"
            :class="getStyleClassForDiceMod(skill, checkboxIndex)"
          />
        </div>
      </div>
  
      <!-- Virtue Row -->
      <div class="virtue-row">
        <span class="skill-name">{{ columnConfig.virtueLabel }}</span>
        <input
          type="number"
          :value="virtueValue.current"
          @input="updateCharacter(`${columnConfig.virtueKey}.current`, Number($event.target.value))"
          class="input-small"
          min="0"
        />
        <span>/</span>
        <input
          type="number"
          :value="virtueValue.max"
          @input="updateCharacter(`${columnConfig.virtueKey}.max`, Number($event.target.value))"
          class="input-small"
          min="0"
        />
      </div>
  
      <!-- Weakness Row -->
      <div class="weakness-row">
        <span class="skill-name">{{ columnConfig.weaknessLabel }}</span>
        <input
          type="number"
          :value="weaknessValue"
          @input="updateCharacter(columnConfig.weaknessKey, Number($event.target.value))"
          class="input-small"
          min="0"
        />
      </div>
  
      <!-- State Row -->
      <div class="state-row">
        <span class="skill-name">{{ this.$capitalizeFirstLetter(columnConfig.firstStateKey) }}</span>
        <input
          type="checkbox"
          :checked="firstStateValue"
          @change="updateCharacter(columnConfig.firstStateKey, $event.target.checked)"
          class="skill-checkbox"
        />
        <input
          type="checkbox"
          :checked="secondStateValue"
          @change="updateCharacter(columnConfig.secondStateKey, $event.target.checked)"
          class="skill-checkbox"
        />
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
      </div>

    </div>
  </template>
  
<script>
import CharacterService from "@/services/CharacterService";

export default {
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
  emits: [
    "update-character",
    "open-skill-check",
  ],
  computed: {
    columnConfig() {
      const columnMappings = {
        body: {
          title: "BODY",
          coreAbilityKey: "body",
          virtueLabel: "Endurance",
          virtueKey: "endurance",
          weaknessLabel: "Load",
          weaknessKey: "load",
          firstStateKey: "weary",
          secondStateKey: "twiceWeary",
          skillRange: [0, 5],
        },
        heart: {
          title: "HEART",
          coreAbilityKey: "heart",
          virtueLabel: "Hope",
          virtueKey: "hope",
          weaknessLabel: "Shadow",
          weaknessKey: "shadow",
          firstStateKey: "miserable",
          secondStateKey: "twiceMiserable",
          skillRange: [5, 10],
        },
        wits: {
          title: "WITS",
          coreAbilityKey: "wits",
          virtueLabel: "Defense",
          virtueKey: "defense",
          weaknessLabel: "Injury",
          weaknessKey: "injury",
          firstStateKey: "helpless",
          secondStateKey: "twiceHelpless",
          skillRange: [10, 15],
        },
      };
      return columnMappings[this.column];
    },
    coreAbilityValue() {
      return this.character[this.columnConfig.coreAbilityKey];
    },
    virtueValue() {
      return this.character[this.columnConfig.virtueKey];
    },
    weaknessValue() {
      return this.character[this.columnConfig.weaknessKey];
    },
    firstStateValue() {
      return this.character.states[this.columnConfig.firstStateKey];
    },
    secondStateValue() {
      return this.character.states[this.columnConfig.secondStateKey];
    },
    skills() {
      const [start, end] = this.columnConfig.skillRange;
      return this.character.skills.slice(start, end);
    },
  },
  methods: {
    getStyleClassForFavoredStatus(skill) {
      if (skill.isFavored && !skill.isIllFavored) return "favored";
      if (skill.isIllFavored && !skill.isFavored) return "ill-favored";
      return "";
    },
    isCheckboxChecked(skill, checkboxIndex) {
      const withinRanks = checkboxIndex < skill.ranks;
      const withinDiceMod =
        checkboxIndex >= skill.ranks &&
        checkboxIndex < skill.ranks + skill.diceMod &&
        skill.diceMod > 0;
      return withinRanks || withinDiceMod;
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
      };
    },
    handleCheckboxChange(skillName, checkboxIndex) {
      const skill = this.character.skills.find((s) => s.name === skillName);
      const newRank = checkboxIndex + 1;
      if (newRank === skill.ranks) {
        skill.ranks -= 1;
      } else {
        skill.ranks = newRank;
      }
      CharacterService.updateFavoredStatus(this.character);
      this.$emit("update-character", this.character);
    },
    // TODO: This seems overly complex for what it's doing, but I can't find a better way at the moment.
    updateCharacter(key, value) {
      const keys = key.split('.'); // Split the key into parts for nested properties
      let target = this.character;

      // Traverse the object to the second-to-last key
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) {
          // Initialize the intermediate object if it doesn't exist
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }

      // Update the final key
      target[keys[keys.length - 1]] = value;

      // Emit the updated character object
      this.$emit("update-character", this.character);
    },
  },
};
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
    max-width: 320px;
  }
  .core-ability-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    height: 28px;
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
  .d12-symbol {
    margin-left: auto;
    margin-right: 8px;
    font-size: 18px;
    width: 25px;
    text-align: center;
    border-radius: 5px;
  }
  .skill-checkbox-group {
    display: flex;
    gap: 5px;
    margin: 0 4px;
  }
  .skill-checkbox {
    margin-left: 5px;
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
    grid-template-columns: 35% 20% 5% 20% 20%;
  }
  .weakness-row {
    grid-template-columns: 35% 65%;
  }
  .state-row {
    grid-template-columns: 35% 10% 10% 45%;
  }

  /* CONDITIONAL STYLES */
  .favored {
    background-color: rgb(110, 221, 110);
    color: black;
  }
  .ill-favored {
    background-color: rgb(254, 135, 135);
    color: black;
  }
  .diceSubtracted {
    accent-color: teal; /* Dice checkbox colors are inverted */
  }
  .diceAdded {
    accent-color: purple; /* Dice checkbox colors are inverted */
  }
</style>