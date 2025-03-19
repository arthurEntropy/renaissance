<template>
  <div class="background">

    <!-- Dropdown for character selection -->
    <div class="character-selector">
      <label for="characterSelect">Select Character: &nbsp;</label>
      <select v-model="selectedCharacter">
        <option v-if="!selectedCharacter" disabled selected>Loading...</option>
        <option v-for="character in characters" :key="character.name" :value="character">
          {{ character.name }}
        </option>
      </select>
    </div>

    <div v-if="selectedCharacter" class="character-sheet">

      <!-- CHARACTER BIO -->
      <div class="character-bio-section">

        <!-- Character Portrait -->
        <div class="character-portrait">
          <img v-if="selectedCharacter.artUrl" 
              :src="selectedCharacter.artUrl" 
              class="portrait-image" 
              @click="openFullSizeCharacterPortraitModal(selectedCharacter.artUrl)" />
          <p v-else>No portrait available</p>
        </div>

        <!-- Bio Fields -->
        <div class="bio-fields">
          <label>Name & Pronouns: <input type="text" v-model="selectedCharacter.name" class="character-name" /></label>
        </div>
      </div>

      <!-- Full-size Image Modal -->
      <div v-if="showFullSizePortraitModal" class="image-modal" @click="closeFullSizeCharacterPortraitModal">
        <div class="image-modal-content" @click.stop>
          <img :src="selectedImageUrl" alt="Full-size Character Portrait" class="full-image" />
          <div class="change-link">
            <a href="javascript:void(0)" @click="openChangeCharacterPortraitModal">Change</a>
          </div>
        </div>
      </div>

      <!-- Modal for changing the image URL -->
      <div v-if="showCharacterArtUrlModal" class="character-art-url-modal-overlay" @click="closeChangeCharacterPortraitModal">
        <div class="character-art-url-modal-content" @click.stop>
          <label for="imageUrl">Image URL:</label>
          <input type="text" v-model="selectedImageUrl" id="imageUrl" class="image-url-input" />
          <button @click="closeChangeCharacterPortraitModal">Cancel</button>
          <button @click="saveCharacterPortraitUrl">Save</button>
        </div>
      </div>


      <!-- CHARACTER STATS -->
      <div class="character-stats-section">

        <!-- First Row -->
        <div class="character-stat-row">

          <!-- Body Column -->
          <div class="core-ability-column">
            <div class="core-ability-header">
              <span class="core-ability-name">BODY</span>
              <input type="number" v-model="selectedCharacter.body" class="core-ability-score"
                    @input="selectedCharacter.body = Math.max(0, selectedCharacter.body)"/> <!-- Prevent negative value -->
            </div>
            <div v-for="(skill) in selectedCharacter.skills.slice(0, 5)" :key="skill.name" class="skill-row">
              <span class="skill-name-clickable" @click="openDiceRollModal(skill.name)">{{ skill.name }}</span>
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
              <input type="number" v-model="selectedCharacter.endurance.current" class="virtue-score"
                    @input="selectedCharacter.endurance.current = Math.max(0, selectedCharacter.endurance.current)"/> <!-- Prevent negative value -->
              <span>/</span>
              <input type="number" v-model="selectedCharacter.endurance.max" class="virtue-score"
                    @input="selectedCharacter.endurance.max = Math.max(0, selectedCharacter.endurance.max)"/> <!-- Prevent negative value -->
            </div>
            <div class="weakness-row">
              <span class="skill-name">Load</span>
              <input type="number" v-model="selectedCharacter.load" class="weakness-score"
                    @input="selectedCharacter.load = Math.max(0, selectedCharacter.load)"/> <!-- Prevent negative value -->
            </div>
            <div class="state-row">
              <span class="skill-name">Weary</span>
              <input type="checkbox" v-model="selectedCharacter.states.weary" class="skill-checkbox" />
              <input type="checkbox" v-model="selectedCharacter.states.twiceWeary" class="skill-checkbox" />
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
            </div>
          </div>

          <!-- Heart Column -->
          <div class="core-ability-column">
            <div class="core-ability-header">
              <span class="core-ability-name">HEART</span>
              <input type="number" v-model="selectedCharacter.heart" class="core-ability-score"
                    @input="selectedCharacter.heart = Math.max(0, selectedCharacter.heart)"/> <!-- Prevent negative value -->
            </div>
            <div v-for="(skill) in selectedCharacter.skills.slice(5, 10)" :key="skill.name" class="skill-row">
              <span class="skill-name-clickable" @click="openDiceRollModal(skill.name)">{{ skill.name }}</span>
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
              <input type="number" v-model="selectedCharacter.hope.current" class="virtue-score"
                    @input="selectedCharacter.hope.current = Math.max(0, selectedCharacter.hope.current)"/> <!-- Prevent negative value -->
              <span>/</span>
              <input type="number" v-model="selectedCharacter.hope.max" class="virtue-score"
                    @input="selectedCharacter.hope.max = Math.max(0, selectedCharacter.hope.max)"/> <!-- Prevent negative value -->
            </div>
            <div class="weakness-row">
              <span class="skill-name">Shadow</span>
              <input type="number" v-model="selectedCharacter.shadow" class="weakness-score"
                    @input="selectedCharacter.shadow = Math.max(0, selectedCharacter.shadow)"/> <!-- Prevent negative value -->
            </div>
            <div class="state-row">
              <span class="skill-name">Miserable</span>
              <input type="checkbox" v-model="selectedCharacter.states.miserable" class="skill-checkbox" />
              <input type="checkbox" v-model="selectedCharacter.states.twiceMiserable" class="skill-checkbox" />
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
            </div>
          </div>  

          <!-- Wits Column -->
          <div class="core-ability-column">
            <div class="core-ability-header">
              <span class="core-ability-name">WITS</span>
              <input type="number" v-model="selectedCharacter.wits" class="core-ability-score"
                    @input="selectedCharacter.wits = Math.max(0, selectedCharacter.wits)"/> <!-- Prevent negative value -->
            </div>
            <div v-for="(skill) in selectedCharacter.skills.slice(10, 15)" :key="skill.name" class="skill-row">
              <span class="skill-name-clickable" @click="openDiceRollModal(skill.name)">{{ skill.name }}</span>
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
              <input type="number" v-model="selectedCharacter.defense.current" class="virtue-score"
                    @input="selectedCharacter.defense.current = Math.max(0, selectedCharacter.defense.current)"/> <!-- Prevent negative value -->
              <span>/</span>
              <input type="number" v-model="selectedCharacter.defense.max" class="virtue-score" 
                    @input="selectedCharacter.defense.max = Math.max(0, selectedCharacter.defense.max)"/> <!-- Prevent negative value -->
            </div>
            <div class="weakness-row">
              <span class="skill-name">Injury</span>
              <input type="number" v-model="selectedCharacter.injury" class="weakness-score"
                    @input="selectedCharacter.injury = Math.max(0, selectedCharacter.injury)"/> <!-- Prevent negative value -->
            </div>
            <div class="state-row">
              <span class="skill-name">Helpless</span>
              <input type="checkbox" v-model="selectedCharacter.states.helpless" class="skill-checkbox" />
              <input type="checkbox" v-model="selectedCharacter.states.twiceHelpless" class="skill-checkbox" />
              <span></span> <!-- Empty span for alignment -->
              <span></span> <!-- Empty span for alignment -->
              
            </div>
          </div>  

          <!-- Conditions Column -->
          <div class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="skill-row" v-for="(value, key) in selectedCharacter.conditions" :key="key">
              <span class="skill-name">{{ capitalizeFirstLetter(key) }}</span>
              <input type="checkbox" class="skill-checkbox" v-model="selectedCharacter.conditions[key]" />
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
            <div v-for="(item, index) in selectedCharacter.equipment" :key="index" class="equipment-row">
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

      <!-- DICE ROLL MODAL -->
      <div v-if="showDiceRollModal" class="dice-roll-modal-overlay" @click="closeDiceRollModal">
        <div class="dice-roll-modal-content" @click.stop>
          <h2>{{ selectedCharacter.name }} rolling...</h2>
          
          <select v-model="selectedSkill" class="dice-roll-modal-skill-dropdown">
            <option v-if="!selectedSkill" disabled selected>No skill selected</option>
            <option v-for="skill in selectedCharacter.skills" :key="skill.name" :value="skill.name">
              {{ skill.name }}
            </option>
          </select>

          <div v-if="selectedSkill">
            <div class="dice-roll-modal-row">
              <label>
                <input type="checkbox" class="skill-checkbox" v-model="getSelectedSkill.isFavored" />
                Favored
              </label>
              <label>
                <input type="checkbox" class="skill-checkbox" v-model="getSelectedSkill.isIllFavored" />
                Ill-Favored
              </label>
            </div>

            <div class="dice-roll-modal-row">
              <label>
                Ranks:
                <input type="number" class="dice-roll-modal-input" v-model="getSelectedSkill.ranks" min="0" />
              </label>
              <label>
                Dice Mod:
                <input type="number" class="dice-roll-modal-input" v-model="getSelectedSkill.diceMod" />
              </label>
            </div>

            <div class="dice-roll-modal-target-number-row">
              <h3>Target Number:</h3>
              <input type="number" class="dice-roll-modal-target-number-input" v-model="targetNumber" min="0" />
            </div>
          </div>

          <button class="roll-button" @click="makeSkillCheck(selectedSkill)">Roll</button>
        </div>

    </div>
  </div>
</div>
</template>

<script>
import axios from 'axios';
import { useCharacterStore } from '../stores/characterStore';
import { updateCharacter } from '../services/characterService';

export default {
  data() {
    return {
      showFullSizePortraitModal: false,
      showCharacterArtUrlModal: false,
      selectedImageUrl: '',
      showDiceRollModal: false,
      selectedSkill: '',
      targetNumber: 0,
      updateTimeout: null,
    };
  },

  mounted() {
    const characterStore = useCharacterStore();
    characterStore.fetchCharacters();
  },

  computed: {

    characters() {
      const characterStore = useCharacterStore();
      return characterStore.characters;
    },

    selectedCharacter: {
      get() {
        const characterStore = useCharacterStore();
        return characterStore.selectedCharacter;
      },
      set(value) {
        const characterStore = useCharacterStore();
        characterStore.selectedCharacter = value;
      }
    },
    
    getSelectedSkill() {
      return this.selectedCharacter.skills.find(skill => skill.name === this.selectedSkill) || {};
    },

    totalWeightCarried() {
      if (!this.selectedCharacter || !this.selectedCharacter.equipment) return 0;
      return Math.round(
        this.selectedCharacter.equipment.reduce((sum, item) => {
          return item.carried ? sum + item.weight * item.quantity : sum;
        }, 0)
      );
    }
  },

  watch: {
    selectedCharacter: {
      handler(newCharacter) {
        if (!newCharacter) return;
        clearTimeout(this.updateTimeout);

        this.updateTimeout = setTimeout(() => {
          updateCharacter(newCharacter);
        }, 1000);
      },
      deep: true
    },
    'selectedCharacter.body'() {
      this.calculateMaxEndurance();
    },
    'selectedCharacter.heart'() {
      this.calculateMaxHope();
    },
    'selectedCharacter.wits'() {
      this.calculateMaxDefense();
    },
    'selectedCharacter.endurance': {
      handler() {
        this.calculateLoad();
        this.calculateWeary();
      },
      deep: true
    },
    'selectedCharacter.hope': {
      handler() {
        this.calculateMiserable();
      },
      deep: true
    },
    'selectedCharacter.defense': {
      handler() {
        this.calculateHelpless();
      },
      deep: true
    },
    'selectedCharacter.load'() {
      this.calculateWeary();
    },
    'selectedCharacter.shadow'() {
      this.calculateMiserable();
    },
    'selectedCharacter.injury'() {
      this.calculateHelpless();
    },
    'selectedCharacter.conditions': {
      handler() {
        this.updateDiceMods();
        this.updateFavoredStatus();
      },
      deep: true
    },
    'selectedCharacter.states': {
      handler() {
        this.updateDiceMods();
        this.updateFavoredStatus();
      },
      deep: true
    },
    'selectedCharacter.equipment': {
      handler() {
        this.calculateLoad();
      },
      deep: true
    }
  },

  methods: {

    /* FORMATTING METHODS */
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },

    formatWeight(value) {
      return Number.isInteger(value) ? value : value.toFixed(1);
    },


    /* CHARACTER PORTRAIT METHODS */
    openFullSizeCharacterPortraitModal(imageUrl) {
      this.selectedImageUrl = imageUrl;
      this.showFullSizePortraitModal = true;
    },

    closeFullSizeCharacterPortraitModal() {
      this.showFullSizePortraitModal = false;
    },

    openChangeCharacterPortraitModal() {
      this.selectedImageUrl = this.selectedCharacter.artUrl || '';
      this.showCharacterArtUrlModal = true;
    },

    closeChangeCharacterPortraitModal() {
      this.showCharacterArtUrlModal = false;
    },

    saveCharacterPortraitUrl() {
      this.selectedCharacter.artUrl = this.selectedImageUrl;
      updateCharacter(this.selectedCharacter);
      this.closeChangeCharacterPortraitModal();
    },
    

    /* AUTO-CALCULATION METHODS */
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
      this.selectedCharacter.endurance.max = this.selectedCharacter.body * 5; // Max Endurance is 5x Body
    },

    calculateMaxHope() {
      this.selectedCharacter.hope.max = this.selectedCharacter.heart * 3; // Max Hope is 3x Heart
    },

    calculateMaxDefense() {
      this.selectedCharacter.defense.max = this.selectedCharacter.wits + 10; // Max Defense is Wits + 10
    },

    calculateLoad() {
      this.selectedCharacter.load = Math.max(0, this.totalWeightCarried - this.selectedCharacter.endurance.max - this.selectedCharacter.body); // Load cannot be below 0
    },

    calculateWeary() {
      this.selectedCharacter.states.weary = this.selectedCharacter.load > this.selectedCharacter.endurance.current;
      this.selectedCharacter.states.twiceWeary = (this.selectedCharacter.load > this.selectedCharacter.endurance.max) && this.selectedCharacter.states.weary;
    },

    calculateMiserable() {
      this.selectedCharacter.states.miserable = this.selectedCharacter.shadow > this.selectedCharacter.hope.current;
      this.selectedCharacter.states.twiceMiserable = (this.selectedCharacter.shadow > this.selectedCharacter.hope.max) && this.selectedCharacter.states.miserable;
    },

    calculateHelpless() {
      this.selectedCharacter.states.helpless = this.selectedCharacter.injury > this.selectedCharacter.defense.current;
      this.selectedCharacter.states.twiceHelpless = (this.selectedCharacter.injury > this.selectedCharacter.defense.max) && this.selectedCharacter.states.helpless;
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
      this.selectedCharacter.skills.forEach(skill => {
        // Reset the diceMod to the base value
        skill.diceMod = 0;

        // Check if the skill is affected by any active effects
        this.selectedCharacter.activeEffects.forEach(effect => {
          effect.skillsModified.forEach(modifiedSkill => {
            if (modifiedSkill.name === skill.name) {
              // Apply the diceMod changes
              skill.diceMod += modifiedSkill.diceMod;
              }
            }
          );
        });

        // Check if the skill is affected by any conditions
        Object.keys(this.selectedCharacter.conditions).forEach(condition => {
          if (this.selectedCharacter.conditions[condition] && effectSkillMaps.conditions[condition].includes(skill.name)) {
            skill.diceMod += conditionAndStateDiceMod;
          }
        });

        // Check if the skill is affected by any states
        Object.keys(this.selectedCharacter.states).forEach(state => {
          if (this.selectedCharacter.states[state] && effectSkillMaps.states[state].includes(skill.name)) {
            skill.diceMod += conditionAndStateDiceMod;
          }
        });
      });
    },

    updateFavoredStatus() {
      // Determine if a skill is ill-favored based on the ranks and diceMod
      // NOTE: Ranks and dice mods cannot make a skill favored, so we only check for ill-favored here
      this.selectedCharacter.skills.forEach(skill => {
        skill.isIllFavored = (skill.ranks + skill.diceMod) < 0;

        // Check if the skill is affected by any active effects
        this.selectedCharacter.activeEffects.forEach(effect => {
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


    /* CHECKBOX METHODS */
    handleCheckboxChange(skillName, checkboxIndex) {
      const skill = this.selectedCharacter.skills.find(skill => skill.name === skillName);
      if (!skill) return;

      const newRank = checkboxIndex + 1; // Ranks are 1-indexed
        
      if (newRank === skill.ranks) {
        skill.ranks -= 1; // Clicking a checkbox that is the same as the current rank should reduce the rank by 1
      } else {
        skill.ranks = newRank;
      }

      this.updateFavoredStatus(); // Ranks affect Favored/Ill-Favored status
    },

    isCheckboxChecked(skill, checkboxIndex) {
      const withinRanks = checkboxIndex < skill.ranks;
      const withinDiceMod = checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0;
      return withinRanks || withinDiceMod;
    },


    /* EQUIPMENT TABLE METHODS */
    addItem() {
      this.selectedCharacter.equipment.push({
        name: '',
        weight: 0,
        quantity: 0,
        carried: false,
      });
    },

    deleteItem(index) {
      if (this.selectedCharacter.equipment.length > 1) {
        this.selectedCharacter.equipment.splice(index, 1);
      }
    },


    /* DICE ROLLING METHODS */

    openDiceRollModal(skill) {
      this.selectedSkill = skill;
      this.showDiceRollModal = true;
    },

    closeDiceRollModal() {
      this.showDiceRollModal = false;
    },

    makeSkillCheck(skillName) {
      
      this.closeDiceRollModal();

      // Find the skill by name and handle if it doesn't exist
      const skill = this.selectedCharacter.skills.find(s => s.name === skillName);
      if (!skill) {
        console.error("Skill not found:", skillName);
        return;
      }

      // Logging statement for debugging
      console.log(
        "Rolling dice for:", skill.name, 
        "Ranks:", skill.ranks, 
        "Dice Mod:", skill.diceMod,
        "Favored:", skill.isFavored,
        "Ill-Favored:", skill.isIllFavored,
        "Conditions:", this.selectedCharacter.conditions,
        "States:", this.selectedCharacter.states
      );

      // Prepare and roll the dice
      const dice = this.prepareDicePool(skill);
      const results = this.rollDice(dice);

      // Check for auto-fail due to twice miserable before applying favored/ill-favored logic
      if (this.selectedCharacter.states.twiceMiserable && this.checkAutoFailTwiceMiserable(results)) {
        this.sendRollResultsToServer(results.map(r => r.symbol), 0, false, skillName, this.generateFooter()); // Auto-fail means the result is 0
        return;
      }

      // If the skill is both Favored and Ill-Favored, it's a flat roll and we apply no further logic
      if (!(skill.isFavored && skill.isIllFavored)) {
        // Otherwise, apply Favored/Ill-Favored dice logic when applicable
        if (skill.isFavored) {
          this.handleFavored(results);
          skillName += " (favored)";
        }
        if (skill.isIllFavored) {
          this.handleIllFavored(results);
          skillName += " (ill-favored)";
        }
      }

      // Determine the outcome of the roll and prepare the footer
      const totalSum = this.calculateTotalSum(results);
      const success = this.determineSuccess(totalSum, results);
      const footer = this.generateFooter();

      // Logging statement for debugging
      console.log("Sending roll to Discord:", {
        rollResults: results.map(r => r.symbol),
        totalSum,
        targetNumber: this.targetNumber,
        name: this.selectedCharacter.name || "Unnamed Character",
        skill: skillName,
        success,
        footer
      });

      // Send the results to the server
      this.sendRollResultsToServer(results.map(r => r.symbol), totalSum, success, skillName, footer);

      // Reset the target number
      this.targetNumber = 0;
    },
    
    prepareDicePool(skill) {
      // We always roll at least one d12
      const dice = [{ sides: 12 }];
      
      // Add a second d12 if the skill is favored or ill-favored
      if (skill.isFavored || skill.isIllFavored) {
        dice.push({ sides: 12 });
      }

      // Calculate the number of d6 to add
      let totalD6 = skill.ranks + skill.diceMod;
      if (totalD6 < 0) totalD6 = 0; // Ensure we don't roll a negative number of dice

      // Add the calculated number of d6
      for (let i = 0; i < totalD6; i++) {
        dice.push({ sides: 6 });
      }

      return dice;
    },

    rollDice(dice) {
      return dice.map(die => {
        const roll = Math.floor(Math.random() * die.sides) + 1; // Choose a random number between 1 and the number of sides
        
        // Add 🌞 for Sol, 💀 for Morte and ✨ for Successes
        let symbol;
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

    checkAutoFailTwiceMiserable(results, isFavored) {
      const d12Rolls = results.filter(r => r.die === 12).map(r => r.roll);
      // If the roll is Favored, only auto-fail if both d12s are 11
      if (isFavored) {
        return d12Rolls.filter(roll => roll === 11).length === 2;
      }
      // Otherwise, auto-fail if any d12 is 11, since it's either the only d12 (flat roll) or the lower of two rolls (Ill-Favored)
      return d12Rolls.includes(11);
    },

    handleFavored(results) {
      const d12Results = results.filter(r => r.die === 12);
      const d12Rolls = d12Results.map(r => r.roll);

      // Find the highest valid d12 roll, treating 11 as the lowest
      const highestD12Roll = d12Rolls.reduce((max, roll) => {
        if (roll === 11) return max; // Ignore 11 unless it's the only roll
        return max === 11 || roll > max ? roll : max;
      }, 11);

      // Flag to track if we've kept one instance of the highest roll
      // This allows us to handle cases where multiple d12s roll the same highest value
      let keptOne = false;

      d12Results.forEach(r => {
        if (r.roll === highestD12Roll && !keptOne) {
          keptOne = true; // Keep this one
        } else {
          r.roll = 0; // Set others to 0 to exclude them from the total
        }
      });
    },

    handleIllFavored(results) {
      const d12Results = results.filter(r => r.die === 12);
      const d12Rolls = d12Results.map(r => r.roll);

      // If there's an 11, it's automatically the lowest roll; otherwise, find the minimum
      const lowestD12Roll = d12Rolls.includes(11) ? 11 : Math.min(...d12Rolls);

      // Flag to track if we've kept one instance of the lowest roll
      // This allows us to handle cases where multiple d12s roll the same lowest value
      let keptOne = false;

      d12Results.forEach(r => {
        if (r.roll === lowestD12Roll && !keptOne) {
          keptOne = true; // Keep this one
        } else {
          r.roll = 0; // Set others to 0
        }
      });
    },

    calculateTotalSum(results) {
      return results.reduce((sum, r) => {
        if (r.die === 6 && r.roll <= 3 && this.selectedCharacter.states.twiceWeary) {
          return sum; // Skip adding D6 results of 3 or less if Twice Weary
        }
        return sum + r.roll;
      }, 0);
    },

    determineSuccess(totalSum) {
      return this.targetNumber && totalSum >= this.targetNumber;
    },

    generateFooter() {
      const footerText = [];

      // Add conditions
      Object.keys(this.selectedCharacter.conditions).forEach(condition => {
        if (this.selectedCharacter.conditions[condition]) {
          footerText.push(this.capitalizeFirstLetter(condition));
        }
      });

      // Add states
      const formattedStateNames = {
        twiceWeary: "Twice Weary",
        twiceMiserable: "Twice Miserable",
        twiceHelpless: "Twice Helpless",
      };

      Object.keys(this.selectedCharacter.states).forEach(state => {
        if (this.selectedCharacter.states[state]) {
          footerText.push(formattedStateNames[state] || this.capitalizeFirstLetter(state));
        }
      });

      // TODO: Add active effects

      return footerText.join(", ") || "";
    },

    sendRollResultsToServer(rollResults, totalSum, success, skillName, footer) {
      axios
        .post('http://localhost:3000/send-message', {
          rollResults: rollResults,
          total: totalSum,
          targetNumber: this.targetNumber,
          name: this.selectedCharacter.name || "Unnamed Character",
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

  select {
      font-family: 'Lora', serif;
      color: white;
      background-color: black;
      font-size: 16px;
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
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: lightgray;
    font-family: 'Lora', serif;
  }

  .character-selector {
    margin: 10px 0 30px 0;
  }
  
  .character-sheet {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0,0,0,0.75);
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
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 80%;
  }

  .character-portrait {
    position: relative;
    margin-bottom: 1rem;
    text-align: center;
    cursor: pointer;
    margin: 20px;
  }

  .portrait-image {
    max-width: 150px;
    max-height: 150px;
    object-fit: cover;
  }
  
  .character-name, .target-number {
    background: black;
    color: white;
    padding: 5px;
    font-size: 18px;
    margin: 10px;
  }

  .change-link {
    margin-top: 0;
    text-align: center;
    font-size: 14px;
    cursor: pointer;
    text-decoration: underline;
  }

  .change-link a {
    text-decoration: none;
    color: darkgray;
  }

  .bio-fields {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  /* CHANGE URL MODAL */
  .character-art-url-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .character-art-url-modal-content {
    background: rgb(30, 30, 30);
    padding: 20px;
    border-radius: 8px;
    width: 70%;
  }

  .image-url-input {
    width: 95%;
    padding: 10px;
    margin: 10px;
    font-size: 16px;
    color: lightgray;
  }

  button {
    padding: 8px 16px;
    margin: 10px;
    font-family: Lora, serif;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
    background: rgb(118, 118, 118);
  }


  /* FULL-SIZE IMAGE MODAL */
  .image-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .image-modal-content {
    position: relative;
    background: black;
    padding: 20px;
    max-width: 90%;
    max-height: 90%;
    overflow: hidden;
    text-align: center;
  }

  .full-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }

  .close-modal {
    position: absolute;
    top: 10px;
    right: 10px;
    background: black;
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
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

  .virtue-score, .weakness-score .dice-roll-modal-score{
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

  /* DICE ROLL MODAL */
  .dice-roll-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .dice-roll-modal-content {
    background: rgb(30, 30, 30);
    padding: 10px;
    border-radius: 8px;
    width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .dice-roll-modal-row {
    width: 90%;
    margin: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .dice-roll-modal-skill-dropdown {
    width: 40%;
    font-size: 18px;
    text-align: center;
  }

  .dice-roll-modal-input {
    width: 32px;
    margin-left: 5px;
    text-align: center;
  }

  .dice-roll-modal-target-number-row {
    width: 90%;
    margin: 20px 0;
    padding-left: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .dice-roll-modal-target-number-input {
    width: 50px;
    font-size: 24px;
    text-align: center;
  }

  .roll-button {
    background-color: goldenrod;
  }

</style>
  