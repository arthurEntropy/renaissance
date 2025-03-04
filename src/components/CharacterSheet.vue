<template>
  <div class="character-sheet">
    <div class="character-info">
      <label>Name: <input type="text" v-model="character.characterName" class="character-name" /></label>
      <label>Target Number: <input type="number" v-model="character.targetNumber" class="target-number" /></label>
    </div>
    <div class="character-stats">

      <!-- First Row -->
      <div class="character-stat-row">

        <!-- Body Column -->
        <div class="ability-column">
          <div class="ability-header">
            <span class="ability-name">BODY</span>
            <input type="number" v-model="character.body" class="ability-score" />
          </div>
          <div v-for="(skill) in character.skills.slice(0, 5)" :key="skill.name" class="skill-row">
            <span class="skill-name" @click="rollDice(skill.name)">{{ skill.name }}</span>
            <span class="d12-symbol" :class="{ 'favored': skill.isFavored, 'ill-favored': skill.isIllFavored }">⭓</span>
            <div class="checkbox-group">
              <input 
                v-for="(n, checkboxIndex) in 5" 
                :key="checkboxIndex" 
                type="checkbox" 
                :checked="isCheckboxChecked(skill, checkboxIndex)"
                @click="handleCheckboxChange(skill.name, checkboxIndex)"
                class="skill-checkbox"
                :class="{
                  'diceSubtracted': skill.ranks - checkboxIndex <= Math.abs(skill.diceMod) && skill.diceMod < 0,
                  'diceAdded': checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0
                }"
              />
            </div>
          </div>
          <div class="virtue-row">
            <span class="ability-name">Endurance</span>
            <input type="number" v-model="character.endurance.current" class="virtue-score" />
            <span>/</span>
            <span class="virtue-score">{{ character.endurance.max }}</span>
          </div>
          <div class="weakness-row">
            <span class="ability-name">Load</span>
            <span class="weakness-score">{{ character.load }}</span>
          </div>
          <div class="state-row">
            <span class="ability-name">Weary</span>
            <input type="checkbox" v-model="character.states.weary" class="skill-checkbox" />
            <input type="checkbox" v-model="character.states.twiceWeary" class="skill-checkbox" />
          </div>
        </div>

        <!-- Heart Column -->
        <div class="ability-column">
          <div class="ability-header">
            <span class="ability-name">HEART</span>
            <input type="number" v-model="character.heart" class="ability-score" />
          </div>
          <div v-for="(skill) in character.skills.slice(5, 10)" :key="skill.name" class="skill-row">
            <span class="skill-name" @click="rollDice(skill.name)">{{ skill.name }}</span>
            <span class="d12-symbol" :class="{ 'favored': skill.isFavored, 'ill-favored': skill.isIllFavored }">⭓</span>
            <div class="checkbox-group">
              <input 
                v-for="(n, checkboxIndex) in 5" 
                :key="checkboxIndex" 
                type="checkbox" 
                :checked="isCheckboxChecked(skill, checkboxIndex)"
                @click="handleCheckboxChange(skill.name, checkboxIndex)"
                class="skill-checkbox"
                :class="{
                  'diceSubtracted': skill.ranks - checkboxIndex <= Math.abs(skill.diceMod) && skill.diceMod < 0,
                  'diceAdded': checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0
                }"
              />
            </div>
          </div>

          <div class="virtue-row">
            <span class="ability-name">Hope</span>
            <input type="number" v-model="character.hope.current" class="virtue-score" />
            <span>/</span>
            <span class="virtue-score">{{ character.hope.max }}</span>
          </div>
          <div class="weakness-row">
            <span class="ability-name">Shadow</span>
            <input type="number" v-model="character.shadow" class="weakness-score" />
          </div>
          <div class="state-row">
            <span class="ability-name">Miserable</span>
            <input type="checkbox" v-model="character.states.miserable" class="skill-checkbox" />
            <input type="checkbox" v-model="character.states.twiceMiserable" class="skill-checkbox" />
          </div>
        </div>  

        <!-- Wits Column -->
        <div class="ability-column">
          <div class="ability-header">
            <span class="ability-name">WITS</span>
            <input type="number" v-model="character.wits" class="ability-score" />
          </div>
          <div v-for="(skill) in character.skills.slice(10, 15)" :key="skill.name" class="skill-row">
            <span class="skill-name" @click="rollDice(skill.name)">{{ skill.name }}</span>
            <span class="d12-symbol" :class="{ 'favored': skill.isFavored, 'ill-favored': skill.isIllFavored }">⭓</span>
            <div class="checkbox-group">
              <input 
                v-for="(n, checkboxIndex) in 5" 
                :key="checkboxIndex" 
                type="checkbox" 
                :checked="isCheckboxChecked(skill, checkboxIndex)"
                @click="handleCheckboxChange(skill.name, checkboxIndex, $event)"
                class="skill-checkbox"
                :class="{
                  'diceSubtracted': skill.ranks - checkboxIndex <= Math.abs(skill.diceMod) && skill.diceMod < 0,
                  'diceAdded': checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0
                }"
              />
            </div>
          </div>
          <div class="virtue-row">
            <span class="ability-name">Defense</span>
            <input type="number" v-model="character.defense.current" class="virtue-score" />
            <span>/</span>
            <span class="virtue-score">{{ character.defense.max }}</span>
          </div>
          <div class="weakness-row">
            <span class="ability-name">Injury</span>
            <input type="number" v-model="character.injury" class="weakness-score" />
          </div>
          <div class="state-row">
            <span class="ability-name">Helpless</span>
            <input type="checkbox" v-model="character.states.helpless" class="skill-checkbox" />
            <input type="checkbox" v-model="character.states.twiceHelpless" class="skill-checkbox" />
          </div>
        </div>  

        <!-- Conditions Column -->
        <div class="conditions-column">
          <div class="section-label">Conditions</div>
          <div class="skill-row" v-for="(value, key) in character.conditions" :key="key">
            <span class="ability-name">{{ capitalizeFirstLetter(key) }}</span>
            <input type="checkbox" class="skill-checkbox" v-model="character.conditions[key]" />
          </div>
        </div>
      </div>

      <!-- Second Row -->
      <div class="character-stat-row">

        <!--Equipment Table-->
        <div class="equipment-table">

          <!-- Header Row -->
          <div class="equipment-row equipment-header">
            <span class="equipment-item-name">Item</span>
            <span class="equipment-header">Weight</span>
            <span class="equipment-header">Quantity</span>
            <span class="equipment-header">Carried</span>
            <span class="equipment-header">lbs Carried</span>
          </div>

          <div v-for="(item, index) in character.equipment" :key="index" class="equipment-row">
            <!-- Editable Item Name -->
            <input type="text" v-model="item.name" class="equipment-item-name-input">
            
            <!-- Prevent negative weight -->
            <input type="number" v-model.number="item.weight" class="virtue-score" 
                  @input="item.weight = Math.max(0, item.weight)">
            
            <!-- Prevent negative quantity -->
            <input type="number" v-model.number="item.quantity" class="virtue-score" 
                  @input="item.quantity = Math.max(0, item.quantity)">
            
            <input type="checkbox" v-model="item.carried" class="equipment-checkbox">
            
            <!-- Weight per item rounded to 1 decimal place -->
            <span class="equipment-total-lbs">
              {{ item.carried ? formatWeight(item.weight * item.quantity) : '0' }}
            </span>

            <!-- Delete Button (ⓧ) -->
            <span @click="deleteItem(index)" class="delete-item-link">ⓧ</span>
          </div>

          <!-- Add Item Button -->
          <div class="equipment-row">
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span @click="addItem" class="add-item-link">+</span>
          </div>

          <!-- Total Weight Row -->
          <div class="equipment-row total-weight-row" style="font-weight: bold; border-top: 2px solid white;">
            <span class="equipment-item-name">Total Weight Carried</span>
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span class="equipment-total-lbs">{{ totalWeightCarried }}</span>
            <span></span> <!-- Empty span for alignment -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      character: {
        characterName: 'Freda',
        targetNumber: 10,
        body: 2,
        heart: 4,
        wits: 3,
        skills: [
          { name: 'Awe', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Strength', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Dexterity', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Fortitude', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Craft', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Perform', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Insight', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Courtesy', ranks: 0, isFavored: true, isIllFavored: false, diceMod: 0 },
          { name: 'Spirit', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Aid', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Persuade', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Awareness', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Stealth', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Lore', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Riddle', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
        ],
        endurance: { current: 0, max: 0 },
        hope: { current: 0, max: 0 },
        defense: { current: 0, max: 0 },
        load: 0,
        shadow: 0,
        injury: 0,
        states: {
          weary: false,
          twiceWeary: false,
          miserable: false,
          twiceMiserable: false,
          helpless: false ,
          twiceHelpless: false
        },
        conditions: {
          insecure: false,
          guilty: false,
          angry: true,
          afraid: false,
          troubled: false
        },
        equipment: [
          { name: 'Rope', weight: 5, quantity: 1, carried: true },
          { name: 'Grappling Hook', weight: 2, quantity: 2, carried: true },
          { name: 'Tinderbox', weight: 1, quantity: 1, carried: true },
        ],
        activeEffects: [
          { name: 'Cool Vibes', skills: ['Awe', 'Perform'], diceMod: 1 },
        ],
      }
    };
  },

  created() {
    this.updateAllCalculatedProperties();
  },

  computed: {
    totalWeightCarried() {
      const total = this.character.equipment.reduce((sum, item) => {
        return item.carried ? sum + item.weight * item.quantity : sum;
      }, 0);
      
      return Math.round(total); // Round to the nearest whole number
    }
  },

  watch: {
    'character.body'() {
      this.calculateMaxEndurance();
    },
    'character.heart'() {
      this.calculateMaxHope();
    },
    'character.wits'() {
      this.calculateMaxDefense();
    },
    'character.skills': {
      handler() {
        this.updateIllFavoredStatus();
      },
      deep: true // Ensure changes to nested properties trigger recalculation
    },
    'character.endurance': {
      handler() {
        // Endurance effects both Load and Weary
        this.calculateLoad();
        this.calculateWeary();
      },
      deep: true // Ensure changes to both current and max Endurance trigger recalculation
    },
    'character.hope': {
      handler() {
        this.calculateMiserable(); // Hope effects Miserable
      },
      deep: true // Ensure changes to both current and max Hope trigger recalculation
    },
    'character.defense': {
      handler() {
        this.calculateHelpless(); // Defense effects Helpless
      },
      deep: true // Ensure changes to both current and max Defense trigger recalculation
    },
    'character.load'() {
      this.calculateWeary(); // Load effects Weary
    },
    'character.shadow'() {
      this.calculateMiserable(); // Shadow effects Miserable
    },
    'character.injury'() {
      this.calculateHelpless(); // Injury effects Helpless
    },
    'character.conditions': {
      handler() {
        this.updateDiceMods();
        this.updateIllFavoredStatus();
      },
      deep: true
    },
    'character.states': {
      handler() {
        this.updateDiceMods();
        this.updateIllFavoredStatus();
      },
      deep: true
    },
    'character.equipment': {
      handler() {
        this.calculateLoad(); // Equipment weight effects Load
      },
      deep: true // Ensure nested changes in Equipment trigger recalculation
    }
  },

  methods: {
    capitalizeFirstLetter(skill) {
      return skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
    },

    updateAllCalculatedProperties() {
      this.calculateMaxEndurance();
      this.calculateMaxHope();
      this.calculateMaxDefense();
      this.calculateLoad();
      this.calculateWeary();
      this.calculateMiserable();
      this.calculateHelpless();
      this.updateDiceMods();
      this.updateIllFavoredStatus();
    },

    calculateMaxEndurance() {
      this.character.endurance.max = this.character.body * 5;
    },

    calculateMaxHope() {
      this.character.hope.max = this.character.heart * 3;
    },

    calculateMaxDefense() {
      this.character.defense.max = this.character.wits + 10;
    },

    handleCheckboxChange(skillName, checkboxIndex) {
      const skill = this.character.skills.find(skill => skill.name === skillName);
      if (!skill) return;

      const newRank = checkboxIndex + 1;
        
      // Clicking a checkbox that is the same as the current rank should reduce the rank by 1
      if (newRank === skill.ranks) {
        skill.ranks -= 1;
      } else {
        skill.ranks = newRank;
      }
    },

    // Determine whether a checkbox should be checked based on the rank
    isCheckboxChecked(skill, checkboxIndex) {
      const withinRanks = checkboxIndex < skill.ranks;
      const withinDiceMod = checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0;
      return withinRanks || withinDiceMod;
    },

    formatWeight(value) {
      return Number.isInteger(value) ? value : value.toFixed(1);
    },

    addItem() {
      // Add a new item with default values
      this.character.equipment.push({
        name: '',
        weight: 0,
        quantity: 0,
        carried: false,
      });
    },

    deleteItem(index) {
      if (this.character.equipment.length > 1) {
        this.character.equipment.splice(index, 1);
      }
    },

    calculateLoad() {
      this.character.load = Math.max(0, this.totalWeightCarried - this.character.endurance.max - this.character.body); // Load cannot be below 0
    },

    calculateWeary() {
      this.character.states.weary = this.character.load > this.character.endurance.current;
      this.character.states.twiceWeary = (this.character.load > this.character.endurance.max) && this.character.states.weary;
    },

    calculateMiserable() {
      this.character.states.miserable = this.character.shadow > this.character.hope.current;
      this.character.states.twiceMiserable = (this.character.shadow > this.character.hope.max) && this.character.states.miserable;
    },

    calculateHelpless() {
      this.character.states.helpless = this.character.injury > this.character.defense.current;
      this.character.states.twiceHelpless = (this.character.injury > this.character.defense.max) && this.character.states.helpless;
    },

    updateDiceMods() {
      const effectSkillMaps = {
        conditions: {
          insecure: ["Awe", "Perform", "Persuade"],
          guilty: ["Strength", "Insight", "Awareness"],
          angry: ["Dexterity", "Courtesy", "Stealth"],
          afraid: ["Fortitude", "Spirit", "Lore"],
          troubled: ["Craft", "Aid", "Riddle"],
        },
        states: {
          weary: ["Awe", "Strength", "Dexterity", "Fortitude", "Craft"],
          twiceWeary: [""],
          miserable: ["Perform", "Insight", "Courtesy", "Spirit", "Aid"],
          twiceMiserable: [""],
          helpless: ["Persuade", "Awareness", "Stealth", "Lore", "Riddle"],
          twiceHelpless: [""]
        }
      };

      const conditionAndStateDiceMod = -1; // Dice mod for conditions and states

      // For each skill stored in data, modify the diceMod based on the active effects, conditions and states
      this.character.skills.forEach(skill => {
        // Reset the diceMod to the base value
        skill.diceMod = 0;

        // Check if the skill is affected by any active effects
        this.character.activeEffects.forEach(effect => {
          if (effect.skills.includes(skill.name)) {
            skill.diceMod += effect.diceMod;
          }
        });

        // Check if the skill is affected by any conditions
        Object.keys(this.character.conditions).forEach(condition => {
          if (this.character.conditions[condition] && effectSkillMaps.conditions[condition].includes(skill.name)) {
            skill.diceMod += conditionAndStateDiceMod;
          }
        });

        // Check if the skill is affected by any states
        Object.keys(this.character.states).forEach(state => {
          if (this.character.states[state] && effectSkillMaps.states[state].includes(skill.name)) {
            skill.diceMod += conditionAndStateDiceMod;
          }
        });
      });
    },

    updateIllFavoredStatus() {
      //update all skills
      this.character.skills.forEach(skill => {
        skill.isIllFavored = (skill.ranks + skill.diceMod) < 0;
      });
    },

    rollDice(skillName) {
      // Find the skill by name and handle if it doesn't exist
      const skill = this.character.skills.find(s => s.name === skillName);
      if (!skill) {
        console.error("Skill not found:", skillName);
        return;
      }

      // Logging statement for debugging
      console.log("Rolling dice for:", skill.name, "Ranks:", skill.ranks, "Dice Mod:", skill.diceMod);

      // Prepare and roll the dice
      const totalD6 = this.calculateTotalD6(skill);
      const dice = this.prepareDicePool(skill, totalD6);
      const results = this.rollDiceResults(dice);

      // Check for auto-fail due to twice miserable before applying favored/ill-favored logic
      if (this.character.states.twiceMiserable && this.checkAutoFailTwiceMiserable(results)) {
        this.sendRollResultsToServer(results.map(r => r.symbol), 0, false, skillName, this.generateFooter());
        return;
      }

      // Apply Favored/Ill-Favored dice logic
      if (skill.isFavored) this.filterFavoredDice(results);
      if (skill.isIllFavored) this.filterIllFavoredDice(results);

      // Determine the outcome of the roll and prepare the footer
      const totalSum = this.calculateTotalSum(results);
      const success = this.determineSuccess(totalSum, results);
      const footer = this.generateFooter();

      // Logging statement for debugging
      console.log("Sending roll to Discord:", {
        rollResults: results.map(r => r.symbol),
        totalSum,
        targetNumber: this.character.targetNumber,
        name: this.character.characterName || "Unnamed Character",
        skill: skillName,
        success
      });

      // Send the results to the server
      this.sendRollResultsToServer(results.map(r => r.symbol), totalSum, success, skillName, footer);
    },

    checkAutoFailTwiceMiserable(results, isFavored) {
      const d12Rolls = results.filter(r => r.die === 12).map(r => r.roll);
      // If the roll is favored, only auto-fail if both d12s are 11
      if (isFavored) {
        return d12Rolls.filter(roll => roll === 11).length === 2;
      }
      // Otherwise, auto-fail if any d12 is 11, since it's either the only d12 (flat roll) or the lower of two rolls (ill-favored)
      return d12Rolls.includes(11);
    },

    calculateTotalD6(skill) {
      let totalD6 = skill.ranks + skill.diceMod;
      return Math.max(0, totalD6); // Ensure we don't roll a negative number of dice
    },
    
    prepareDicePool(skill, totalD6) {
      const dice = [{ id: 'd12', name: 'D12', sides: 12, emoji: '⭓', selected: true }];
      
      // Add a second d12 if the skill is favored or ill-favored
      if (skill.isFavored || skill.isIllFavored) {
        dice.push({ id: 'd12-2', name: 'D12', sides: 12, emoji: '⭓', selected: true });
      }

      // Add the calculated number of D6 dice
      for (let i = 0; i < totalD6; i++) {
        dice.push({ id: `d6-${i + 1}`, name: 'D6', sides: 6, emoji: '◽️', selected: true });
      }

      return dice;
    },

    rollDiceResults(dice) {
      return dice
        .filter(die => die.selected)
        .map(die => {
          const roll = Math.floor(Math.random() * die.sides) + 1;
          let symbol = die.sides === 12 ? '⭓' : '◽️';

          if (die.sides === 12) {
            if (roll === 12) {
              symbol = '⭓12🌞';
            } else if (roll === 11) {
              symbol = '⭓11💀';
            } else {
              symbol = `⭓${roll}`;
            }
          } else if (die.sides === 6 && roll === 6) {
            symbol = `◽️6✨`;
          } else {
            symbol = `◽️${roll}`;
          }

          return { die: die.sides, roll: roll, symbol: symbol };
        });
    },

    filterFavoredDice(results) {
      const d12Rolls = results.filter(r => r.die === 12).map(r => r.roll);

      // If we have at least one non-11 roll, pick the highest of those; otherwise, keep 11
      const highestD12Roll = d12Rolls.some(roll => roll !== 11)
        ? Math.max(...d12Rolls.filter(roll => roll !== 11))
        : 11;
      
      results.forEach(r => {
        if (r.die === 12 && r.roll !== highestD12Roll) {
          r.roll = 0; // Exclude the non-highest d12 roll
        }
      });
    },

    filterIllFavoredDice(results) {
      const d12Rolls = results.filter(r => r.die === 12).map(r => r.roll);

      // If there's an 11, it's automatically the lowest roll; otherwise, find the minimum
      const lowestD12Roll = d12Rolls.includes(11) ? 11 : Math.min(...d12Rolls);

      results.forEach(r => {
        if (r.die === 12 && r.roll !== lowestD12Roll) {
          r.roll = 0; // Exclude the non-lowest d12 roll
        }
      });
    },

    calculateTotalSum(results) {
      return results.reduce((sum, r) => {
        if (r.die === 6 && r.roll <= 3 && this.character.states.twiceWeary) {
          return sum; // Skip adding D6 results of 3 or less if twice weary
        }
        return sum + r.roll;
      }, 0);
    },

    generateFooter() {
      const effectsModifyingRoll = [];
      const formattedStateNames = {
        twiceWeary: "Twice Weary",
        twiceMiserable: "Twice Miserable",
        twiceHelpless: "Twice Helpless",
      };

      Object.keys(this.character.conditions).forEach(condition => {
        if (this.character.conditions[condition]) {
          effectsModifyingRoll.push(this.capitalizeFirstLetter(condition));
        }
      });

      Object.keys(this.character.states).forEach(state => {
        if (this.character.states[state]) {
          effectsModifyingRoll.push(formattedStateNames[state] || this.capitalizeFirstLetter(state));
        }
      });

      return effectsModifyingRoll.join(", ") || "";
    },

    determineSuccess(totalSum) {
      return this.character.targetNumber && totalSum >= this.character.targetNumber;
    },

    sendRollResultsToServer(rollResults, totalSum, success, skillName, footer) {
      axios
        .post('http://localhost:3000/send-message', {
          rollResults: rollResults,
          total: totalSum,
          targetNumber: this.character.targetNumber,
          name: this.character.characterName || "Unnamed Character",
          skill: skillName,
          success: success,
          footer: footer
        })
        .catch((error) => {
          console.error('Error sending roll:', error);
          alert('Failed to send roll. Check your connection or server.');
        });
    }
  }
};
</script>

<style scoped>
  .character-sheet {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: black;
    color: white;
    font-family: 'Lora', serif;
    padding: 20px;
    width: 1100px;
  }
  
  .character-info {
    display: flex;
    justify-content: space-between;
    width: 80%;
    margin-bottom: 20px;
  }
  
  .character-name, .target-number {
    background: black;
    color: white;
    border: 1px solid white;
    padding: 5px;
    font-size: 18px;
    margin-left: 10px;
  }
  
  .character-stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    width: 100%;
  }

  .character-stat-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .ability-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-width: 251px;
    margin: 10px 30px;
  }

  .conditions-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: .5;
    margin: 0 20px;
  }
  
  .ability-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    font-size: 20px;
    height: 28px
  }

  .section-label {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0px;
    font-size: 14px;
    font-style: italic;
    height: 28px
  }
  
  .ability-score {
    width: 50px;
    text-align: center;
    margin-left: 10px;
    font-size: 18px;
  }
  
  .skill-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 5px 0;
    height: 25px
  }
  
  .skill-name {
    text-align: left;
    flex: 1;
    max-width: 50px;
    cursor: pointer;
    transition: color 0.2s ease-in-out;
    position: relative; /* Needed for the tooltip */
  }

  .skill-name:hover {
    color: goldenrod;
    text-shadow: 0px 0px 5px yellow;
  }

  .skill-name:hover::after {
    opacity: 1;
    visibility: visible;
  }
  
  .d12-symbol {
    margin-left: auto;
    margin-right: 10px;
    font-size: 18px;
    width: 25px;
    text-align: center;
    border-radius: 5px;
  }
  
  .checkbox-group {
    display: flex;
    gap: 5px;
  }
  
  .skill-checkbox {
    width: 16px;
    height: 16px;
    accent-color: white;
  }

  .virtue-row, .weakness-row, .state-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 10px;
  }

  .virtue-score, .weakness-score {
    width: 35px;
    text-align: center;
    margin-left: 5px;
  }

  .state-checkbox {
    width: 16px;
    height: 16px;
    margin-left: 10px;
  }

  .state-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .state-row .ability-name {
    flex: 1;
  }

  .state-row .checkbox-group {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .checkbox-group input {
    margin: 0 4px;
  }

  .equipment-table-title {
    font-size: 20px;
    margin-bottom: 10px;
  }
  
  .equipment-table {
    display: flex;
    flex-direction: column;
    align-items: left;
    flex: 1;
    max-width: 500px;
    margin: 100px 30px;
  }

  .equipment-row {
    display: grid;
    grid-template-columns: 60% 10% 10% 7% 7% 6%;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
    height: 25px;
  }

  .equipment-item-name {
    text-align: left;
    font-size: 16px;
    padding-left: 5px;
  }

  .equipment-input {
    width: 10px;
    margin: 3px 5px;
    font-size: 14px;
    text-align: center;
    height: 10px;
  }

  .equipment-input {
    width: 100%;
    text-align: center;
    padding: 5px;
    font-size: 12px;
  }

  .equipment-total-lbs {
    text-align: center;
    font-size: 16px;
  }

  .equipment-checkbox {
    margin-left: auto;
  }

  .equipment-header {
    font-size: 14px;
    font-style: italic;
    height: 28px;
    text-decoration: underline;
    text-align: left;
    display: grid;
    grid-template-columns: 60% 10% 10% 7% 7% 6%;
  }

  .equipment-header:nth-child(n+2) {
    transform: rotate(-45deg);
    transform-origin: left bottom;
    white-space: nowrap;
    display: inline-block;
    margin-left: 20px;
  }

  .equipment-checkbox {
    width: 16px;
    height: 16px;
    accent-color: white;
    margin-left: 10px;
  }

  .delete-item-link {
    cursor: pointer;
    color: gray;
    font-size: 20px;
    line-height: 20px;
    text-align: center;
    margin-left: 10px;
    display: inline-block;
    vertical-align: middle;
  }

  .add-item-link {
    cursor: pointer;
    color: gray;
    font-size: 20px;
    line-height: 20px;
    text-align: center;
    margin-left: 10px;
    display: inline-block;
    vertical-align: middle;
  }

  input, .equipment-item-name-input, .virtue-score, .equipment-checkbox {
    font-family: 'Lora', serif;
  }

  .favored {
      background-color: green;
      color: white; /* Ensure good contrast */
    }

  .ill-favored {
    background-color: red;
    color: white; /* Ensure good contrast */
  }

  .diceSubtracted {
    accent-color: red;
  }

  .diceAdded {
    accent-color: green;
  }

</style>
  