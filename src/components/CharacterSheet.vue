<template>
  <div class="background">
    <div class="character-sheet">

      <!-- Character Bio Section -->
      <div class="character-bio-section">
        <label>Name & Pronouns: <input type="text" v-model="character.characterName" class="character-name" /></label>
        <label>
          Target Number: <input type="number" v-model="character.targetNumber" class="target-number"
                @input="character.targetNumber = Math.max(0, character.targetNumber)"/> <!-- Prevent negative value -->
        </label>
      </div>

      <!-- Character Stats Section -->
      <div class="character-stats-section">

        <!-- First Row -->
        <div class="character-stat-row">

          <!-- Body Column -->
          <div class="core-ability-column">
            <div class="core-ability-header">
              <span class="core-ability-name">BODY</span>
              <input type="number" v-model="character.body" class="core-ability-score"
                    @input="character.body = Math.max(0, character.body)"/> <!-- Prevent negative value -->
            </div>
            <div v-for="(skill) in character.skills.slice(0, 5)" :key="skill.name" class="skill-row">
              <span class="skill-name-clickable" @click="rollDice(skill.name)">{{ skill.name }}</span>
              <span class="d12-symbol" :class="{
                'favored': (skill.isFavored && !skill.isIllFavored), 
                'ill-favored': (skill.isIllFavored && !skill.isFavored)
              }">⭓</span>
              <div class="skill-checkbox-group">
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
              <span class="skill-name">Endurance</span>
              <input type="number" v-model="character.endurance.current" class="virtue-score"
                    @input="character.endurance.current = Math.max(0, character.endurance.current)"/> <!-- Prevent negative value -->
              <span>/</span>
              <input type="number" v-model="character.endurance.max" class="virtue-score"
                    @input="character.endurance.max = Math.max(0, character.endurance.max)"/> <!-- Prevent negative value -->
            </div>
            <div class="weakness-row">
              <span class="skill-name">Load</span>
              <input type="number" v-model="character.load" class="weakness-score"
                    @input="character.load = Math.max(0, character.load)"/> <!-- Prevent negative value -->
            </div>
            <div class="state-row">
              <span class="skill-name">Weary</span>
              <input type="checkbox" v-model="character.states.weary" class="skill-checkbox" />
              <input type="checkbox" v-model="character.states.twiceWeary" class="skill-checkbox" />
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
            </div>
          </div>

          <!-- Heart Column -->
          <div class="core-ability-column">
            <div class="core-ability-header">
              <span class="core-ability-name">HEART</span>
              <input type="number" v-model="character.heart" class="core-ability-score"
                    @input="character.heart = Math.max(0, character.heart)"/> <!-- Prevent negative value -->
            </div>
            <div v-for="(skill) in character.skills.slice(5, 10)" :key="skill.name" class="skill-row">
              <span class="skill-name-clickable" @click="rollDice(skill.name)">{{ skill.name }}</span>
              <span class="d12-symbol" :class="{
                'favored': (skill.isFavored && !skill.isIllFavored), 
                'ill-favored': (skill.isIllFavored && !skill.isFavored)
              }">⭓</span>
              <div class="skill-checkbox-group">
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
              <span class="skill-name">Hope</span>
              <input type="number" v-model="character.hope.current" class="virtue-score"
                    @input="character.hope.current = Math.max(0, character.hope.current)"/> <!-- Prevent negative value -->
              <span>/</span>
              <input type="number" v-model="character.hope.max" class="virtue-score"
                    @input="character.hope.max = Math.max(0, character.hope.max)"/> <!-- Prevent negative value -->
            </div>
            <div class="weakness-row">
              <span class="skill-name">Shadow</span>
              <input type="number" v-model="character.shadow" class="weakness-score"
                    @input="character.shadow = Math.max(0, character.shadow)"/> <!-- Prevent negative value -->
            </div>
            <div class="state-row">
              <span class="skill-name">Miserable</span>
              <input type="checkbox" v-model="character.states.miserable" class="skill-checkbox" />
              <input type="checkbox" v-model="character.states.twiceMiserable" class="skill-checkbox" />
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
            </div>
          </div>  

          <!-- Wits Column -->
          <div class="core-ability-column">
            <div class="core-ability-header">
              <span class="core-ability-name">WITS</span>
              <input type="number" v-model="character.wits" class="core-ability-score"
                    @input="character.wits = Math.max(0, character.wits)"/> <!-- Prevent negative value -->
            </div>
            <div v-for="(skill) in character.skills.slice(10, 15)" :key="skill.name" class="skill-row">
              <span class="skill-name-clickable" @click="rollDice(skill.name)">{{ skill.name }}</span>
              <span class="d12-symbol" :class="{
                'favored': (skill.isFavored && !skill.isIllFavored), 
                'ill-favored': (skill.isIllFavored && !skill.isFavored)
              }">⭓</span>
              <div class="skill-checkbox-group">
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
              <span class="skill-name">Defense</span>
              <input type="number" v-model="character.defense.current" class="virtue-score"
                    @input="character.defense.current = Math.max(0, character.defense.current)"/> <!-- Prevent negative value -->
              <span>/</span>
              <input type="number" v-model="character.defense.max" class="virtue-score" 
                    @input="character.defense.max = Math.max(0, character.defense.max)"/> <!-- Prevent negative value -->
            </div>
            <div class="weakness-row">
              <span class="skill-name">Injury</span>
              <input type="number" v-model="character.injury" class="weakness-score"
                    @input="character.injury = Math.max(0, character.injury)"/> <!-- Prevent negative value -->
            </div>
            <div class="state-row">
              <span class="skill-name">Helpless</span>
              <input type="checkbox" v-model="character.states.helpless" class="skill-checkbox" />
              <input type="checkbox" v-model="character.states.twiceHelpless" class="skill-checkbox" />
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              
            </div>
          </div>  

          <!-- Conditions Column -->
          <div class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="skill-row" v-for="(value, key) in character.conditions" :key="key">
              <span class="skill-name">{{ capitalizeFirstLetter(key) }}</span>
              <input type="checkbox" class="skill-checkbox" v-model="character.conditions[key]" />
            </div>
          </div>
        </div>

        <!-- Second Row -->
        <div class="character-stat-row">

          <!--Equipment Table-->
          <div class="equipment-table">

            <!-- Title Row -->
            <div class="equipment-title">EQUIPMENT</div>

            <!-- Header Row -->
            <div class="equipment-header-row">
              <span class="equipment-header">item</span>
              <span class="equipment-header">lbs</span>
              <span class="equipment-header">qty</span>
              <span class="equipment-header-angled">carried</span>
              <span class="equipment-header-angled">lbs carried</span>
            </div>

            <!--Equipment item rows-->
            <div v-for="(item, index) in character.equipment" :key="index" class="equipment-row">
              <input type="text" v-model="item.name" class="equipment-item-name-input">
              <input type="number" v-model.number="item.weight" class="equipment-weight-input" 
                    @input="item.weight = Math.max(0, item.weight)"> <!-- Prevent negative weight -->
              <input type="number" v-model.number="item.quantity" class="equipment-quantity-input" 
                    @input="item.quantity = Math.max(0, item.quantity)"> <!-- Prevent negative quantity -->
              <input type="checkbox" v-model="item.carried" class="equipment-checkbox">
              <span class="equipment-lbs-carried">
                {{ item.carried ? formatWeight(item.weight * item.quantity) : '0' }} <!-- Rounded to 1 decimal place -->
              </span>
              <span @click="deleteItem(index)" class="delete-item-link">ⓧ</span>
            </div>

            <!-- Add Item Row -->
            <div class="equipment-row">
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              <span @click="addItem" class="add-item-link">+</span>
            </div>

            <!-- Total Weight Row -->
            <div class="equipment-row total-weight-row" style="border-top: 1px solid lightgray;">
              <span>Total Weight Carried</span>
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              <span class="equipment-lbs-carried">{{ totalWeightCarried }}</span>
              <span></span> <!-- Empty span for alignment -->
            </div>
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
          { name: 'Awe', ranks: 2, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Strength', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Dexterity', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Fortitude', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Craft', ranks: 3, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Perform', ranks: 1, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Insight', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Courtesy', ranks: 2, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Spirit', ranks: 2, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Aid', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Persuade', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Awareness', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Stealth', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
          { name: 'Lore', ranks: 3, isFavored: false, isIllFavored: false, diceMod: 0 },
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
          angry: false,
          afraid: false,
          troubled: false
        },
        equipment: [
          { name: 'Rope', weight: 5, quantity: 1, carried: true },
          { name: 'Grappling Hook', weight: 2, quantity: 2, carried: true },
          { name: 'Tinderbox', weight: 1, quantity: 1, carried: true },
        ],
        activeEffects: [
          { name: 'Cool Vibes', skillsModified: [
            { name: 'Awe',
              diceMod: -1,
              makeFavored: false,
              makeIllFavored: false
            },
            { name: 'Perform',
              diceMod: 1,
              makeFavored: false,
              makeIllFavored: false
            }
          ]},
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
        this.updateFavoredStatus();
      },
      deep: true
    },
    'character.states': {
      handler() {
        this.updateDiceMods();
        this.updateFavoredStatus();
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
      this.updateFavoredStatus();
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

      this.updateFavoredStatus();
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

      // For each skill stored in data, modify the diceMod based on the active effects, conditions, and states
      this.character.skills.forEach(skill => {
        // Reset the diceMod to the base value
        skill.diceMod = 0;

        // Check if the skill is affected by any active effects
        this.character.activeEffects.forEach(effect => {
          effect.skillsModified.forEach(modifiedSkill => {
            if (modifiedSkill.name === skill.name) {
              // Apply the diceMod changes
              skill.diceMod += modifiedSkill.diceMod;
              }
            }
          );
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

    updateFavoredStatus() {
      // Determine if a skill is ill-favored based on the ranks and diceMod
      // NOTE: Ranks and dice mods cannot make a skill favored, so we only check for ill-favored here
      this.character.skills.forEach(skill => {
        skill.isIllFavored = (skill.ranks + skill.diceMod) < 0;

        // Check if the skill is affected by any active effects
        this.character.activeEffects.forEach(effect => {
          effect.skillsModified.forEach(modifiedSkill => {
            if (modifiedSkill.name === skill.name) {
              // Apply the favored, and illFavored changes
              if (modifiedSkill.makeFavored) {
                skill.isFavored = true;
              }
              if (modifiedSkill.makeIllFavored) {
                skill.isIllFavored = true;
              }
            }
          });
        });
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

  input {
      font-family: 'Lora', serif;
      color: white;
      background-color: black;
  }

  .background {
    background-image: url('https://cdn.midjourney.com/b380594a-e352-4deb-b7b0-c3fff0095472/0_3.png');
    background-size: cover;
    background-attachment: fixed;
    background-position: center;
    position: absolute;
    min-width: 100%;
    min-height: 100%;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .character-sheet {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0,0,0,0.75);
    color: lightgray;
    font-family: 'Lora', serif;
    width: 80%;
    max-height: 100%;
    padding: 20px;
  }

  @media (max-width: 567px) {
    .character-sheet {
      width: 90%;
      padding: 0;
    }
  }

  
  /* CHARACTER BIO SECTION */
  .character-bio-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 80%;
    margin-bottom: 20px;
  }
  
  .character-name, .target-number {
    background: black;
    color: white;
    padding: 5px;
    font-size: 18px;
    margin-left: 10px;
  }

  
  /* CHARACTER STATS SECTION */
  .character-stats-section {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
  }

  .character-stat-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

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
    justify-content: center;
    margin-bottom: 10px;
    font-size: 20px;
    height: 28px
  }

  .core-ability-name {
    font-weight: bold;
    font-size: 24px;
  }
  
  .core-ability-score {
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
    max-width: 85px;
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

  .skill-name-clickable:hover::after {
    opacity: 1;
    visibility: visible;
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
      background-color: green;
      color: black;
    }

  .ill-favored {
    background-color: rgb(255, 104, 104);
    color: black;
  }
  
  .skill-checkbox-group {
    display: flex;
    gap: 5px;
    margin: 0 4px;
  }
  
  .skill-checkbox {
    filter: invert(100%);
    width: 16px;
    height: 16px;
    accent-color: darkgray; /* Dice checkbox colors are inverted */
    color: black; /* Dice checkbox colors are inverted */
  }

  .diceSubtracted {
    accent-color: teal; /* Dice checkbox colors are inverted */
  }

  .diceAdded {
    accent-color: purple; /* Dice checkbox colors are inverted */
  }

  .virtue-row, .weakness-row, .state-row {
    display: grid;
    align-items: left;
    height: 25px;
    width: 100%;
    margin-top: 10px;
  }

  .virtue-row, .weakness-row {
    grid-template-columns: 35% 20% 5% 20% 20%;
  }

  .state-row {
    grid-template-columns: 35% 10% 10% 45%;
  }

  .virtue-score, .weakness-score {
    width: 35px;
    height: 20px;
    text-align: center;
    margin-left: 5px;
  }


  /* CONDITIONS */
  .conditions-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-width: 100px;
    margin: 0 20px;
  }

  .conditions-header {
    display: flex;
    align-items: end;
    margin: 10px 0px;
    font-size: 14px;
    font-style: italic;
    height: 28px
  }


  /* EQUIPMENT */
  .equipment-table {
    display: flex;
    flex-direction: column;
    align-items: left;
    flex: 1;
    width: 90%;
    max-width: 400px;
    margin: 50px 20px;
  }
  
  .equipment-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
  }
  
  .equipment-header-row {
    font-size: 14px;
    font-style: italic;
    height: 28px;
    text-decoration: underline;
    text-align: left;
    display: grid;
    grid-template-columns: 50% 13% 13% 8% 8% 3%;
  }

  .equipment-header {
    padding: 0 0 0 5px;
  }

  .equipment-header-angled {
    transform: rotate(-45deg);
    transform-origin: left bottom;
    white-space: nowrap;
    display: inline-block;
    margin-left: 20px;
  }

  .equipment-row {
    display: grid;
    grid-template-columns: 50% 13% 13% 8% 8% 3%;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
    height: 30px;
  }

  .equipment-item-name-input, .equipment-weight-input, .equipment-quantity-input {
    text-align: left;
    padding: 5px;
    font-size: 12px;
    margin: 5px;
  }

  .equipment-checkbox {
    width: 16px;
    height: 16px;
    filter: invert(100%);
    accent-color: lightgoldenrodyellow;
    margin-left: 10px;
  }

  .equipment-lbs-carried {
    text-align: center;
    font-size: 14px;
    font-weight: bold;
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
    padding-left: 15px;
    display: inline-block;
    vertical-align: middle;
  }

</style>
  