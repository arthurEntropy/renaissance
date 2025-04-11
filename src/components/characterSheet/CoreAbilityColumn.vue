<template>
    <div class="core-ability-column">
      <!-- Core Ability Header -->
      <div class="core-ability-header">
        <h2>{{ title }}</h2>
        <input
        type="number"
        :value="coreAbilityValue"
        @input="$emit('update-core-ability', { key: title.toLowerCase(), value: Number($event.target.value) })"
        class="input-large"
        min="0"
        />
      </div>
  
      <!-- Skills -->
      <div
        v-for="(skill) in skills"
        :key="skill.name"
        class="skill-row"
      >
        <span
          class="skill-name-clickable"
          @click="$emit('open-skill-check', skill.name)"
        >
          {{ skill.name }}
        </span>
        <span class="d12-symbol" :class="getFavoredClass(skill)">⭓</span>
        <div class="skill-checkbox-group">
            <div class="skill-checkbox-group">
    <input
        v-for="(n, checkboxIndex) in 5"
        :key="checkboxIndex"
        type="checkbox"
        :checked="isCheckboxChecked(skill, checkboxIndex)"
        @click="$emit('update-skill-checkbox', skill.name, checkboxIndex)"
        class="skill-checkbox"
        :class="getSkillCheckboxDiceModClass(skill, checkboxIndex)"
    />
    </div>
        </div>
      </div>
  
      <!-- Virtue Row -->
      <div class="virtue-row">
        <span class="skill-name">{{ virtueLabel }}</span>
        <input
        type="number"
        :value="virtueValue.current"
        @input="$emit('update-virtue', { key: `${virtueLabel.toLowerCase()}.current`, value: Number($event.target.value) })"
        class="input-small"
        min="0"
        />
        <span>/</span>
        <input
        type="number"
        :value="virtueValue.max"
        @input="$emit('update-virtue', { key: `${virtueLabel.toLowerCase()}.max`, value: Number($event.target.value) })"
        class="input-small"
        min="0"
        />
      </div>
  
      <!-- Weakness Row -->
      <div class="weakness-row">
        <span class="skill-name">{{ weaknessLabel }}</span>
        <input
        type="number"
        :value="weaknessValue"
        @input="$emit('update-weakness', { key: weaknessLabel.toLowerCase(), value: Number($event.target.value) })"
        class="input-small"
        min="0"
        />
      </div>
  
      <!-- State Row -->
      <div class="state-row">
        <span class="skill-name">{{ capitalizeFirstLetter(firstStateKey) }}</span>
        <input
          type="checkbox"
          :checked="firstStateValue"
          @change="$emit('update-state', { key: firstStateKey, value: $event.target.checked })"
          class="skill-checkbox"
        />
        <input
          type="checkbox"
          :checked="secondStateValue"
          @change="$emit('update-state', { key: secondStateKey, value: $event.target.checked })"
          class="skill-checkbox"
        />
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      title: {
        type: String,
        required: true,
      },
      coreAbilityValue: {
        type: Number,
        required: true,
      },
      skills: {
        type: Array,
        required: true,
      },
      virtueLabel: {
        type: String,
        required: true,
      },
      virtueValue: {
        type: Object,
        required: true,
      },
      weaknessLabel: {
        type: String,
        required: true,
      },
      weaknessValue: {
        type: Number,
        required: true,
      },
      firstStateKey: {
        type: String,
        required: true,
      },
      firstStateValue: {
        type: Boolean,
        required: true,
      },
      secondStateKey: {
        type: String,
        required: true,
      },
      secondStateValue: {
        type: Boolean,
        required: true,
      },
    },
    emits: [
      "update-core-ability",
      "update-virtue",
      "update-weakness",
      "update-skill-checkbox",
      "update-state",
      "open-skill-check",
    ],
    methods: {
      getFavoredClass(skill) {
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
      getSkillCheckboxDiceModClass(skill, checkboxIndex) {
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
      capitalizeFirstLetter(string) {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      },
    },
  };
  </script>
  
  <style scoped>
  .core-ability-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-width: 300px;
    margin: 10px 30px;
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
  
  .favored {
    background-color: rgb(110, 221, 110);
    color: black;
  }
  
  .ill-favored {
    background-color: rgb(254, 135, 135);
    color: black;
  }
  
  .skill-checkbox-group {
    display: flex;
    gap: 5px;
    margin: 0 4px;
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
  
  .skill-checkbox {
    margin-left: 5px;
  }

.diceSubtracted {
accent-color: teal; /* Dice checkbox colors are inverted */
}

.diceAdded {
accent-color: purple; /* Dice checkbox colors are inverted */
}
  </style>