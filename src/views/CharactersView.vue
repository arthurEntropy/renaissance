<template>
  <div class="character-view">

    <!--CHARACTER SELECTION-->
    <div v-if="!selectedCharacter" class="character-selection">
      <h2>CHARACTERS</h2>
      <button class="button button-primary new-character-button" @click="createNewCharacter">New Character</button>
      <div class="selection-cards-container">
        <SelectionCard 
          v-for="character in characters"
          :key="character.id" 
          :item="character" 
          @click="selectCharacter(character)"
        />
      </div>
    </div>


    <!--CHARACTER SHEET-->
    <div v-if="selectedCharacter" class="character-sheet">

      <!-- Gear Icon -->
      <div class="settings-icon" @click="openSettingsModal">⚙️</div>

      <!-- Saving Status -->
      <p v-if="savingStatus" class="saving-status">{{ savingStatus }}</p>

      <!-- Close Button -->
      <p class="close-button" @click="deselectCharacter">ⓧ</p>


      <!-- CHARACTER BIO SECTION-->
      <div class="character-bio-section">

        <!-- Character Art -->
        <div class="character-art">
          <img v-if="selectedCharacter.artUrls" 
              :src="selectedCharacter.artUrls[0] || defaultArtUrl" 
              class="character-art-image" 
              @click="openFullSizeCharacterArtModal(selectedCharacter.artUrl)" />
          <p v-else>No character art available</p>
        </div>

        <!-- Bio Fields -->
        <div class="bio-fields">
          <div class="bio-field">
            <label>Name: <input type="text" v-model="selectedCharacter.name" class="bio-input-field"/></label>
          </div>
          <div class="bio-field">
            <label>Pronouns: <input type="text" v-model="selectedCharacter.pronouns" class="bio-input-field"/></label>
          </div>
          <div class="bio-field">
            <label>Ancestry: <input type="text" v-model="selectedCharacter.ancestries" class="bio-input-field" /></label>
          </div>
          <div class="bio-field">
            <label>Culture(s): <input type="text" v-model="selectedCharacter.cultures" class="bio-input-field" /></label>
          </div>
        </div>

        <!-- Personality and Background -->
        <label class="personality-and-background">Personality & Background:
          <textarea v-model="selectedCharacter.personalityAndBackground" class="personality-and-background-textarea"></textarea>
        </label>

      </div>


      <!-- CHARACTER STATS SECTION -->
      <div class="character-stats-section">

        <!-- Body Column -->
        <div class="core-ability-column">
          <div class="core-ability-header">
            <H2>BODY</H2>
            <input type="number" v-model="selectedCharacter.body" class="input-large" min="0"/>
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
            <input type="number" v-model="selectedCharacter.endurance.current" class="input-small" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.endurance.max" class="input-small" min="0"/>
          </div>
          <div class="weakness-row">
            <span class="skill-name">Load</span>
            <input type="number" v-model="selectedCharacter.load" class="input-small" min="0"/>
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
            <H2>HEART</H2>
            <input type="number" v-model="selectedCharacter.heart" class="input-large" min="0"/>
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
            <input type="number" v-model="selectedCharacter.hope.current" class="input-small" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.hope.max" class="input-small" min="0"/>
          </div>
          <div class="weakness-row">
            <span class="skill-name">Shadow</span>
            <input type="number" v-model="selectedCharacter.shadow" class="input-small" min="0"/>
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
            <H2>WITS</H2>
            <input type="number" v-model="selectedCharacter.wits" class="input-large" min="0"/>
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
            <input type="number" v-model="selectedCharacter.defense.current" class="input-small" min="0"/>
            <span>/</span>
            <input type="number" v-model="selectedCharacter.defense.max" class="input-small" min="0"/>
          </div>
          <div class="weakness-row">
            <span class="skill-name">Injury</span>
            <input type="number" v-model="selectedCharacter.injury" class="input-small" min="0"/>
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
        <div class="conditions-column-container">
          <div class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="conditions-row" v-for="(value, key) in selectedCharacter.conditions" :key="key">
              <span>{{ capitalizeFirstLetter(key) }}</span>
              <input type="checkbox" class="skill-checkbox" v-model="selectedCharacter.conditions[key]" />
            </div>
          </div>
          <!-- XP/MP -->
          <div class="xp-mp-section">
            <div class= "xp-mp-row">
              <div class="xp-field">
                <span class="skill-name">XP: </span>
                <input type="number" v-model="selectedCharacter.xp" class="input-small"/>
              </div>
            </div>
            <div class="xp-mp-row">
                <span class="skill-name">MP: </span>
                <input type="number" v-model="selectedCharacter.mp.current" class="input-small" min="0"/>
                <span>/</span>
                <input type="number" v-model="selectedCharacter.mp.max" class="input-small" min="0"/>
              </div>
          </div>
        </div>

        <!--Equipment Table-->
        <div class="equipment-table">

          <!-- Title Row -->
          <H2>EQUIPMENT</H2>

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
            <input type="text" v-model="item.name" class="input-small equipment-item-name-input" @change="updateEquipmentItem(index, 'name', item.name)">
            <input type="number" v-model.number="item.weight" class="input-small" @input="updateEquipmentItem(index, 'weight', Math.max(0, item.weight))">
            <input type="number" v-model.number="item.quantity" class="input-small" @input="updateEquipmentItem(index, 'quantity', Math.max(0, item.quantity))">
            <input type="checkbox" v-model="item.carried" @change="updateEquipmentItem(index, 'carried', item.carried)">
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

      
      <!-- MODALS -->
      <FullSizeCharacterArtModal
        v-if="showFullSizeCharacterArtModal"
        :imageUrl="selectedCharacter.artUrls[0] || defaultArtUrl"
        @close="closeFullSizeCharacterArtModal"
        @change-art="openChangeCharacterArtModal"
      />

      <ChangeCharacterArtModal
        v-if="showChangeCharacterArtModal"
        :initialArtUrl="selectedCharacter.artUrls[0] || ''"
        @close="closeChangeCharacterArtModal"
        @save="saveCharacterArtUrl"
      />

      <SkillCheckModal
        v-if="showSkillCheckModal"
        :characterName="selectedCharacter.name"
        :skills="selectedCharacter.skills"
        :selectedSkillName="selectedSkillName"
        :targetNumber="targetNumber"
        @close="closeSkillCheckModal"
        @roll="handleSkillCheck"
      />

      <SettingsModal
        v-if="showSettingsModal"
        @close="closeSettingsModal"
        @delete="openDeleteConfirmationModal"
      />

      <DeleteConfirmationModal
        v-if="showDeleteConfirmationModal"
        :characterName="selectedCharacter.name"
        @close="closeDeleteConfirmationModal"
        @confirm="deleteCharacter"
      />

    </div>
  </div>
</template>

<script>
import { useCharacterStore } from '@/stores/characterStore';
import { mapState } from 'pinia';
import CharacterService from '@/services/CharacterService';
import DiceService from '@/services/DiceService.js';
import SelectionCard from '@/components/SelectionCard.vue';
import FullSizeCharacterArtModal from '@/components/modals/FullSizeCharacterArtModal.vue';
import ChangeCharacterArtModal from '@/components/modals/ChangeCharacterArtModal.vue';
import SkillCheckModal from '@/components/modals/SkillCheckModal.vue';
import SettingsModal from '@/components/modals/SettingsModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';

export default {
  components: {
    SelectionCard,
    FullSizeCharacterArtModal,
    ChangeCharacterArtModal,
    SkillCheckModal,
    SettingsModal,
    DeleteConfirmationModal
  },
  data() {
    const characterStore = useCharacterStore();
    return {
      characterStore,
      showFullSizeCharacterArtModal: false,
      showChangeCharacterArtModal: false,
      showSkillCheckModal: false,
      showSettingsModal: false,
      showDeleteConfirmationModal: false,
      deleteConfirmationInput: '',
      selectedCharacterArtUrl: '',
      selectedSkillName: '',
      targetNumber: 0,
      updateTimeout: null,
      savingStatus: '',
      defaultArtUrl: CharacterService.DEFAULT_ART_URL,
      tempArtUrl: '',
    };
  },

  mounted() {
    this.characterStore.fetchCharacters();
  },

  computed: {
    ...mapState(useCharacterStore, ['characters']),
    characters() {
      return this.characterStore.characters.filter(character => !character.isDeleted);
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
        this.savingStatus = 'saving changes...'; // Show immediately
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          CharacterService.saveCharacter(newCharacter).then(() => {
            this.savingStatus = 'changes saved'; // Show after saving
            setTimeout(() => {
              this.savingStatus = ''; // Clear the message after 3 seconds
            }, 3000);
          });
        }, 1000); // Only save after 1 second to avoid too many saves
      },
      deep: true,
    },

    // Changes to all these stats need to trigger recalculation of derived stats
    'selectedCharacter.body'() {
      if (!this.selectedCharacter || this.selectedCharacter.body === undefined) return; // Null check
      CharacterService.handleBodyChange(this.selectedCharacter);
    },
    'selectedCharacter.heart'() {
      if (!this.selectedCharacter || this.selectedCharacter.heart === undefined) return; // Null check
      CharacterService.handleHeartChange(this.selectedCharacter);
    },
    'selectedCharacter.wits'() {
      if (!this.selectedCharacter || this.selectedCharacter.wits === undefined) return; // Null check
      CharacterService.handleWitsChange(this.selectedCharacter);
    },
    'selectedCharacter.endurance': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.endurance) return; // Null check
        CharacterService.handleEnduranceChange(this.selectedCharacter);
      },
      deep: true,
    },
    'selectedCharacter.hope': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.hope) return; // Null check
        CharacterService.handleHopeChange(this.selectedCharacter);
      },
      deep: true,
    },
    'selectedCharacter.defense': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.defense) return; // Null check
        CharacterService.handleDefenseChange(this.selectedCharacter);
      },
      deep: true,
    },
    'selectedCharacter.load'() {
      if (!this.selectedCharacter || this.selectedCharacter.load === undefined) return; // Null check
      CharacterService.handleLoadChange(this.selectedCharacter);
    },
    'selectedCharacter.shadow'() {
      if (!this.selectedCharacter || this.selectedCharacter.shadow === undefined) return; // Null check
      CharacterService.handleShadowChange(this.selectedCharacter);
    },
    'selectedCharacter.injury'() {
      if (!this.selectedCharacter || this.selectedCharacter.injury === undefined) return; // Null check
      CharacterService.handleInjuryChange(this.selectedCharacter);
    },
    'selectedCharacter.states': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.states) return; // Null check
        CharacterService.handleStatesChange(this.selectedCharacter);
      },
      deep: true,
    },
    'selectedCharacter.conditions': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.conditions) return; // Null check
        CharacterService.handleConditionsChange(this.selectedCharacter);
      },
      deep: true,
    },
    'selectedCharacter.equipment': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.equipment) return; // Null check
        CharacterService.handleEquipmentChange(this.selectedCharacter);
      },
      deep: true,
    },
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

    /* CHARACTER SELECTION AND CREATION */
    selectCharacter(character) {
      this.selectedCharacter = character;
      this.characterStore.selectedCharacter = character;
      this.closeAllModals();
    },
    deselectCharacter() {
      this.selectedCharacter = null;
      this.characterStore.selectedCharacter = null;
      this.characterStore.fetchCharacters();
    },
    async createNewCharacter() {
      const createdCharacter = await CharacterService.createNewCharacter();
      await this.characterStore.fetchCharacters();
      const newCharacter = this.characterStore.characters.find(
        (character) => character.id === createdCharacter.id
      );
        this.selectCharacter(newCharacter);
    },
    closeAllModals() {
      this.showFullSizeCharacterArtModal = false;
      this.showChangeCharacterArtModal = false;
      this.showSkillCheckModal = false;
      this.showSettingsModal = false;
      this.showDeleteConfirmationModal = false;
    },

    /* SETTINGS MODAL */
    openSettingsModal() {
      this.showSettingsModal = true;
    },
    closeSettingsModal() {
      this.showSettingsModal = false;
    },

    /* DELETE CONFIRMATION MODAL */
    openDeleteConfirmationModal() {
      this.deleteConfirmationInput = '';
      this.showDeleteConfirmationModal = true;
    },
    closeDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = false;
    },

    /* DELETE CHARACTER */
    deleteCharacter() {
      this.selectedCharacter.isDeleted = true;
      CharacterService.saveCharacter(this.selectedCharacter);
      this.closeDeleteConfirmationModal();
      this.deselectCharacter();
    },

    /* CHARACTER ART */
    openFullSizeCharacterArtModal(imageUrl) {
      this.selectedCharacterArtUrl = imageUrl;
      this.showFullSizeCharacterArtModal = true;
    },
    closeFullSizeCharacterArtModal() {
      this.showFullSizeCharacterArtModal = false;
    },
    openChangeCharacterArtModal() {
      this.tempArtUrl = this.selectedCharacter.artUrls[0] || '';
      this.showChangeCharacterArtModal = true;
    },
    closeChangeCharacterArtModal() {
      this.showChangeCharacterArtModal = false;
    },
    saveCharacterArtUrl() {
      if (!this.isValidImageUrl(this.tempArtUrl)) {
        alert("Please enter a valid image URL."); // Show an error message
        return;
      }

      if (!this.selectedCharacter.artUrls) {
        this.selectedCharacter.artUrls = [];
      }

      this.selectedCharacter.artUrls[0] = this.tempArtUrl; // Update the character's art URL
      CharacterService.saveCharacter(this.selectedCharacter);
      this.closeChangeCharacterArtModal();
    },
    isValidImageUrl(url) {
      const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i; // Matches common image formats
      return urlPattern.test(url);
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

  .character-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  /* CHARACTER SELECTION */
  .character-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;
  }
  .selection-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding-bottom: 50px;
  }
  .new-character-button {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  
  /* CHARACTER SHEET */
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
  .settings-icon {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 20px;
    cursor: pointer;
  }
  .close-button {
    position: absolute;
    top: -10px;
    right: 15px;
    z-index: 1000;
    font-size: 20px;
    text-decoration: none;
    color: gray;
    cursor: pointer;
  }
  .saving-status {
    position: absolute;
    top: 2px;
    right: 50px;
    font-size: 14px;
    font-style: italic;
    color: darkgray;
    z-index: 1000;
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
  .bio-fields {
    display: flex;
    flex-direction: column;
    margin: 0 20px;
  }
  .bio-field {
    display: flex;
    flex-wrap: nowrap;
  }
  .bio-input-field {
    background: black;
    color: lightgray;
    padding: 3px;
    font-size: 18px;
    margin: 3px 3px 3px 10px;
  }
  .personality-and-background {
    display: flex;
    height: 155px;
    width: 300px;
    flex-direction: column;
  }
  .personality-and-background-textarea {
    color: lightgray;
    padding: 5px;
    resize: none;
    border-radius: 4px;
    line-height: 1.4;
    margin-top: 10px;
    height: 100%;
    width: 90%;
  }
  @media (max-width: 567px) {
    .bio-fields {
      align-items: center;
    }
    .personality-and-background {
      margin-top: 20px;
    }
  }
  

  /* CHARACTER STATS SECTION */
  .character-stats-section {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
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
    margin-bottom: 10px;
    height: 28px
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


  /* CONDITIONS COLUMN */
  .conditions-column-container {
    display: flex;
    flex-direction: column;
  }
  .conditions-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    width: 100px;
    margin: 0 20px;
  }
  @media (max-width: 567px) {
    .conditions-column {
      margin: 0 40px;
    }
  }
  .conditions-header {
    display: flex;
    align-items: end;
    margin: 10px 0px;
    font-size: 14px;
    font-style: italic;
    height: 28px
  }
  .conditions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 5px 0;
    height: 25px
  }
  .xp-mp-section {
    display: flex;
    flex-direction: column;
    position: relative;
    right: 25px;
    bottom: 10px;
  }
  @media (max-width: 567px) {
    .xp-mp-section {
      right: 0;
      bottom: 0;
      margin: 20px;
      align-items: center;
    }
  }
  .xp-mp-row {
    display: flex;
    align-items: center;
    justify-content: right;
    margin: 5px 0;
  }


  /* EQUIPMENT */
  .equipment-table {
    display: flex;
    flex-direction: column;
    align-items: left;
    flex: 1;
    max-width: 400px;
    margin: 20px;
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
    margin-bottom: 10px;
    height: 30px;
  }
  .total-weight-row {
    border-top: 1px solid lightgray;
  }
  .equipment-lbs-carried {
    text-align: center;
    font-size: 14px;
    font-weight: bold;
  }
  .delete-item-link {
    cursor: pointer;
    color: gray;
    font-size: 15px;
    text-align: center;
    margin: 0 0 -1px 10px;
  }
  .add-item-link {
    cursor: pointer;
    color: gray;
    font-size: 20px;
    padding-left: 12px;
  }

</style>
  