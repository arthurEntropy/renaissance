<template>
  <div v-if="selectedCharacter" class="character-sheet">

    <!-- CLOSE BUTTON -->
    <router-link to="/character-selection">
      <p class="close-button">🆇</p>
    </router-link>

    <!-- CHARACTER BIO SECTION-->
    <div class="character-bio-section">

      <!-- Character Art -->
      <div class="character-art">
        <img v-if="selectedCharacter.artUrl" 
            :src="selectedCharacter.artUrl" 
            class="character-art-image" 
            @click="openFullSizeCharacterArtModal(selectedCharacter.artUrl)" />
        <p v-else>No character art available</p>
      </div>

      <!-- Bio Fields -->
      <div class="bio-fields">
        <div class= "bio-fields-row">
          <div class="bio-field">
            <label>Name: <input type="text" v-model="selectedCharacter.name" class="bio-input-field"/></label>
          </div>
        </div>
        <div class= "bio-fields-row">
          <div class="bio-field">
            <label>Pronouns: <input type="text" v-model="selectedCharacter.pronouns" class="bio-input-field" style="width:100px"/></label>
          </div>
        </div>
        <div class = "bio-fields-row">
          <div class="bio-field">
            <label>Ancestry: <input type="text" v-model="selectedCharacter.ancestries" class="bio-input-field" /></label>
          </div>
        </div>
        <div class = "bio-fields-row">
          <div class="bio-field">
            <label>Culture(s): <input type="text" v-model="selectedCharacter.cultures" class="bio-input-field" /></label>
          </div>
        </div>
      </div>

      <!-- Personality and Background -->
      <div class="personality-and-background">
        <div class="bio-fields-row">
          <label>Personality & Background:
            <textarea v-model="selectedCharacter.personalityAndBackground" class="personality-and-background-textarea"></textarea>
          </label>
        </div>
      </div>

      <!-- XP/MP -->
      <div class="xp-mp-section">
        <div class= "xp-mp-row">
          <div class="xp-field">
            <span class="skill-name">XP: </span>
            <input type="number" v-model="selectedCharacter.xp" class="xp-mp-input"/>
          </div>
        </div>
        <div class="xp-mp-row">
            <span class="skill-name">MP: </span>
            <input type="number" v-model="selectedCharacter.mp.current" class="xp-mp-input" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.mp.max" class="xp-mp-input" min="0"/>
          </div>
      </div>

    </div>

    <!-- FULL-SIZE CHARACTER ART MODAL -->
    <div v-if="showFullSizeCharacterArtModal" class="full-size-character-art-modal" @click="closeFullSizeCharacterArttModal">
      <div class="full-size-character-art-modal-content" @click.stop>
        <img :src="selectedCharacterArtUrl" alt="Full-size Character Portrait" class="full-size-character-art-modal-image" />
        <div class="change-link">
          <a href="javascript:void(0)" @click="openChangeCharacterArtModal">Change</a>
        </div>
      </div>
    </div>

    <!-- CHANGE CHARACTER ART MODAL -->
    <div v-if="showChangeCharacterArtModal" class="character-art-url-modal-overlay" @click="closeChangeCharacterArtModal">
      <div class="character-art-url-modal-content" @click.stop>
        <label for="imageUrl">Image URL:</label>
        <input type="text" v-model="selectedCharacterArtUrl" id="imageUrl" class="image-url-input" />
        <button @click="closeChangeCharacterArtModal">Cancel</button>
        <button @click="saveCharacterArtUrl">Save</button>
      </div>
    </div>

    <!-- CHARACTER STATS SECTION -->
    <div class="character-stats-section">

      <!-- First Row -->
      <div class="character-stat-row">

        <!-- Body Column -->
        <div class="core-ability-column">
          <div class="core-ability-header">
            <span class="core-ability-name">BODY</span>
            <input type="number" v-model="selectedCharacter.body" class="core-ability-score" min="0"/>
          </div>
          <div v-for="(skill) in selectedCharacter.skills.slice(0, 5)" :key="skill.name" class="skill-row">
            <span class="skill-name-clickable" @click="openSkillCheckModal(skill.name)">{{ skill.name }}</span>
            <span class="d12-symbol" :class="getFavoredClass(skill)">⭓</span>
            <div class="skill-checkbox-group">
              <input 
                v-for="(n, checkboxIndex) in 5" 
                :key="checkboxIndex" 
                type="checkbox" 
                :checked="isCheckboxChecked(skill, checkboxIndex)"
                @click="handleCheckboxChange(skill.name, checkboxIndex)"
                class="skill-checkbox"
                :class="getSkillCheckboxDiceModClass(skill, checkboxIndex)"
              />
            </div>
          </div>
          <div class="virtue-row">
            <span class="skill-name">Endurance</span>
            <input type="number" v-model="selectedCharacter.endurance.current" class="virtue-score" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.endurance.max" class="virtue-score" min="0"/>
          </div>
          <div class="weakness-row">
            <span class="skill-name">Load</span>
            <input type="number" v-model="selectedCharacter.load" class="weakness-score" min="0"/>
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
            <input type="number" v-model="selectedCharacter.heart" class="core-ability-score" min="0"/>
          </div>
          <div v-for="(skill) in selectedCharacter.skills.slice(5, 10)" :key="skill.name" class="skill-row">
            <span class="skill-name-clickable" @click="openSkillCheckModal(skill.name)">{{ skill.name }}</span>
            <span class="d12-symbol" :class="getFavoredClass(skill)">⭓</span>
            <div class="skill-checkbox-group">
              <input 
                v-for="(n, checkboxIndex) in 5" 
                :key="checkboxIndex" 
                type="checkbox" 
                :checked="isCheckboxChecked(skill, checkboxIndex)"
                @click="handleCheckboxChange(skill.name, checkboxIndex)"
                class="skill-checkbox"
                :class="getSkillCheckboxDiceModClass(skill, checkboxIndex)"
              />
            </div>
          </div>
          <div class="virtue-row">
            <span class="skill-name">Hope</span>
            <input type="number" v-model="selectedCharacter.hope.current" class="virtue-score" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.hope.max" class="virtue-score" min="0"/>
          </div>
          <div class="weakness-row">
            <span class="skill-name">Shadow</span>
            <input type="number" v-model="selectedCharacter.shadow" class="weakness-score" min="0"/>
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
            <input type="number" v-model="selectedCharacter.wits" class="core-ability-score" min="0"/>
          </div>
          <div v-for="(skill) in selectedCharacter.skills.slice(10, 15)" :key="skill.name" class="skill-row">
            <span class="skill-name-clickable" @click="openSkillCheckModal(skill.name)">{{ skill.name }}</span>
            <span class="d12-symbol" :class="getFavoredClass(skill)">⭓</span>
            <div class="skill-checkbox-group">
              <input 
                v-for="(n, checkboxIndex) in 5" 
                :key="checkboxIndex" 
                type="checkbox" 
                :checked="isCheckboxChecked(skill, checkboxIndex)"
                @click="handleCheckboxChange(skill.name, checkboxIndex, $event)"
                class="skill-checkbox"
                :class="getSkillCheckboxDiceModClass(skill, checkboxIndex)"
              />
            </div>
          </div>
          <div class="virtue-row">
            <span class="skill-name">Defense</span>
            <input type="number" v-model="selectedCharacter.defense.current" class="virtue-score" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.defense.max" class="virtue-score" min="0"/>
          </div>
          <div class="weakness-row">
            <span class="skill-name">Injury</span>
            <input type="number" v-model="selectedCharacter.injury" class="weakness-score" min="0"/>
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
            <input type="text" v-model="item.name" class="equipment-item-name-input" @change="updateEquipmentItem(index, 'name', item.name)">
            <input type="number" v-model.number="item.weight" class="equipment-weight-input" @input="updateEquipmentItem(index, 'weight', Math.max(0, item.weight))">
            <input type="number" v-model.number="item.quantity" class="equipment-quantity-input" @input="updateEquipmentItem(index, 'quantity', Math.max(0, item.quantity))">
            <input type="checkbox" v-model="item.carried" class="equipment-checkbox" @change="updateEquipmentItem(index, 'carried', item.carried)">
            <span class="equipment-lbs-carried"> {{ item.carried ? formatWeight(item.weight * item.quantity) : '0' }} </span>
            <span @click="removeEquipmentItem(index)" class="delete-item-link">ⓧ</span>
          </div>

          <!-- Add Item Row -->
          <div class="equipment-row">
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span @click="addEquipmentItem()" class="add-item-link">+</span>
          </div>

          <!-- Total Weight Row -->
          <div class="equipment-row total-weight-row">
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
    <div v-if="showSkillCheckModal" class="dice-roll-modal-overlay" @click="closeSkillCheckModal">
      <div class="dice-roll-modal-content" @click.stop>
        <h2>{{ selectedCharacter.name }} rolling...</h2>
        <select v-model="selectedSkillName" class="dice-roll-modal-skill-dropdown">
          <option v-if="!selectedSkillName" disabled selected>No skill selected</option>
          <option v-for="skill in selectedCharacter.skills" :key="skill.name" :value="skill.name">
            {{ skill.name }}
          </option>
        </select>
        <div v-if="selectedSkillName">
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
        <button class="roll-button" @click="handleSkillCheck(selectedSkillName)">Roll</button>
      </div>
    </div>

  </div>
</template>

<script>
import { useCharacterStore } from '@/stores/characterStore';
import CharacterService from '@/services/CharacterService';
import DiceService from '@/services/DiceService.js';

export default {
  data() {
    const characterStore = useCharacterStore();
    return {
      characterStore,
      showFullSizeCharacterArtModal: false,
      showChangeCharacterArtModal: false,
      showSkillCheckModal: false,
      selectedCharacterArtUrl: '',
      selectedSkillName: '',
      targetNumber: 0,
      updateTimeout: null,
    };
  },

  computed: {
    characters() {
      return this.characterStore.characters;
    },
    selectedCharacter: {
      get() {
        return this.characterStore.selectedCharacter;
      },
      set(value) {
        this.characterStore.selectedCharacter = value;
      }
    },
    getSelectedSkill() {
      return this.selectedCharacter.skills.find(skill => skill.name === this.selectedSkillName) || {};
    },
    totalWeightCarried() {
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
          CharacterService.saveCharacter(newCharacter);
        }, 1000);
      },
      deep: true
    },

    // Changes to all these stats need to trigger recalculation of derived stats
    'selectedCharacter.body'() {
      CharacterService.handleBodyChange(this.selectedCharacter);
    },
    'selectedCharacter.heart'() {
      CharacterService.handleHeartChange(this.selectedCharacter);
    },
    'selectedCharacter.wits'() {
      CharacterService.handleWitsChange(this.selectedCharacter);
    },
    'selectedCharacter.endurance': {
      handler() {
        CharacterService.handleEnduranceChange(this.selectedCharacter);
      },
      deep: true
    },
    'selectedCharacter.hope': {
      handler() {
        CharacterService.handleHopeChange(this.selectedCharacter);
      },
      deep: true
    },
    'selectedCharacter.defense': {
      handler() {
        CharacterService.handleDefenseChange(this.selectedCharacter);
      },
      deep: true
    },
    'selectedCharacter.load'() {
      CharacterService.handleLoadChange(this.selectedCharacter);
    },
    'selectedCharacter.shadow'() {
      CharacterService.handleShadowChange(this.selectedCharacter);
    },
    'selectedCharacter.injury'() {
      CharacterService.handleInjuryChange(this.selectedCharacter);
    },
    'selectedCharacter.states'() {
      CharacterService.handleStatesChange(this.selectedCharacter);
    },
    'selectedCharacter.conditions'() {
      CharacterService.handleConditionsChange(this.selectedCharacter);
    },
    'selectedCharacter.equipment'() {
      CharacterService.handleEquipmentChange(this.selectedCharacter);
    }
  },

  methods: {

    /* FORMATTING */
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },
    getSkillCheckboxDiceModClass(skill, checkboxIndex) {
      return {
        'diceSubtracted': skill.ranks - checkboxIndex <= Math.abs(skill.diceMod) && skill.diceMod < 0,
        'diceAdded': checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0
      };
    },
    getFavoredClass(skill) {
      if (skill.isFavored && !skill.isIllFavored) return 'favored';
      if (skill.isIllFavored && !skill.isFavored) return 'ill-favored';
      return '';
    },
    formatWeight(value) {
      return Number.isInteger(value) ? value : value.toFixed(1);
    },

    /* CHARACTER ART */
    openFullSizeCharacterArtModal(imageUrl) {
      this.selectedCharacterArtUrl = imageUrl;
      this.showFullSizeCharacterArtModal = true;
    },
    closeFullSizeCharacterArttModal() {
      this.showFullSizeCharacterArtModal = false;
    },
    openChangeCharacterArtModal() {
      this.selectedCharacterArtUrl = this.selectedCharacter.artUrl || '';
      this.showChangeCharacterArtModal = true;
    },
    closeChangeCharacterArtModal() {
      this.showChangeCharacterArtModal = false;
    },
    saveCharacterArtUrl() {
      this.selectedCharacter.artUrl = this.selectedCharacterArtUrl;
      CharacterService.saveCharacter(this.selectedCharacter);
      this.closeChangeCharacterArtModal();
    },

    /* RANK CHECKBOXES */
    handleCheckboxChange(skillName, checkboxIndex) {
      this.selectedSkillName = skillName;
      const skill = this.getSelectedSkill;
      const newRank = checkboxIndex + 1;
      if (newRank === skill.ranks) {
        skill.ranks -= 1;
      } else {
        skill.ranks = newRank;
      }
      CharacterService.updateFavoredStatus(this.selectedCharacter);
    },
    isCheckboxChecked(skill, checkboxIndex) {
      const withinRanks = checkboxIndex < skill.ranks;
      const withinDiceMod = checkboxIndex >= skill.ranks && checkboxIndex < skill.ranks + skill.diceMod && skill.diceMod > 0;
      return withinRanks || withinDiceMod;
    },

    /* SKILL CHECKS */
    openSkillCheckModal(skillName) {
      this.selectedSkillName = skillName;
      this.showSkillCheckModal = true;
    },
    closeSkillCheckModal() {
      this.showSkillCheckModal = false;
    },
    handleSkillCheck() {
      this.closeSkillCheckModal();
      DiceService.makeSkillCheck(this.getSelectedSkill, this.selectedCharacter, this.targetNumber);
      this.targetNumber = 0;
    },

    /* EQUIPMENT */
    addEquipmentItem() {
      CharacterService.addEquipmentItem(this.selectedCharacter);
    },
    removeEquipmentItem(index) {
      CharacterService.removeEquipmentItem(this.selectedCharacter, index);
    },
    updateEquipmentItem(index, key, value) {
      CharacterService.updateEquipmentItem(this.selectedCharacter, index, key, value);
    }
  }
};
</script>

<style scoped>

  label {
    font-size: 12px;
  }

  input, textarea, select {
    font-family: 'Lora', serif;
    color: white;
    background-color: black;
  }

  textarea {
    margin: 10px;
    width: 100%;
  }

  select {
    font-size: 16px;
  }

  .character-selector {
    margin: 10px 0 30px 0;
  }
  
  .character-sheet {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0,0,0,0.65);
    width: 80%;
    max-height: 100%;
    padding: 20px;
    position: relative;
  }

  @media (max-width: 567px) {
    .character-sheet {
      width: 90%;
      padding: 0;
    }
  }

  .close-button {
    position: absolute;
    top: -10px;
    right: 15px;
    z-index: 1000;
    font-size: 20px;
    text-decoration: none;
    color: white;
  }

  
  /* CHARACTER BIO SECTION */

  .character-bio-section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-bottom: 10px;
  }

  .character-art {
    position: relative;
    text-align: center;
    cursor: pointer;
    margin: 20px 20px 20px 0;
  }

  .character-art-image {
    max-width: 150px;
    max-height: 150px;
    object-fit: cover;
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
    margin: 0 10px;
  }

  .bio-fields-row {
    display: flex;
    align-items: left;
  }

  .bio-field {
    display: flex;
    flex-wrap: nowrap;
  }

  .bio-input-field {
    background: black;
    color: white;
    padding: 5px;
    font-size: 16px;
    margin: 3px;
  }

  .personality-and-background {
    min-width: 275px;
    height: 100%;
    align-items: center;
    vertical-align: top;
    padding-top: 12px;
  }

  .personality-and-background-textarea {
    color: lightgray;
    height: 125px;
    padding: 5px;
    resize: none;
    border-radius: 4px;
    line-height: 1.4;
  }

  .xp-mp-section {
    display: flex;
    flex-direction: column;
    align-items: right;
    margin: 0 40px;
  }

  .xp-mp-row {
    display: flex;
    align-items: center;
    justify-content: right;
    margin: 5px 0;
  }

  .xp-field {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 5px 0;
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
  .full-size-character-art-modal {
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

  .full-size-character-art-modal-content {
    position: relative;
    background: black;
    padding: 20px;
    max-width: 90%;
    max-height: 90%;
    overflow: hidden;
    text-align: center;
  }

  .full-size-character-art-modal-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
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

  .xp-mp-input, .virtue-score, .weakness-score, .dice-roll-modal-score{
    width: 35px;
    height: 20px;
    text-align: center;
    margin-left: 5px;
    margin-right: 5px;
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

  .total-weight-row {
    border-top: 1px solid lightgray;
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
  