<template>
  <div class="character-view">

    <!--CHARACTER SELECTION-->
    <div v-if="!selectedCharacter" class="character-selection">
      <div class="selection-cards-container">
        <SelectionCard 
          v-for="character in characters"
          :key="character.id" 
          :item="character" 
          @click="selectCharacter(character)"
        />
        
        <!-- New "Add" card with plus icon -->
        <div class="add-concept-card" @click="createNewCharacter">
          <div class="add-icon">+</div>
          <div class="add-text">Add Character</div>
        </div>
      </div>
    </div>

    <!--CHARACTER SHEET-->
    <div v-if="selectedCharacter" class="character-sheet">
      <div class="settings-icon" @click="openSettingsModal">⚙️</div>
      <p v-if="savingStatus" class="saving-status">{{ savingStatus }}</p>
      <p class="close-button" @click="deselectCharacter">ⓧ</p>

      <!-- CHARACTER BIO SECTION-->
      <CharacterBioSection
        :character="selectedCharacter"
        :defaultArtUrl="defaultArtUrl || ''"
        @open-full-size-art="openFullSizeCharacterArtModal"
        @update-character="updateCharacter"
      />

      <!-- CHARACTER STATS SECTION -->
      <div class="character-stats-section">

        <CoreAbilityColumn
          :character="selectedCharacter"
          column="body"
          @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal"
        />
        <CoreAbilityColumn
          :character="selectedCharacter"
          column="heart"
          @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal"
        />
        <CoreAbilityColumn
          :character="selectedCharacter"
          column="wits"
          @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal"
        />

        <!-- Conditions Column -->
        <div class="conditions-column-container">
          <div class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="conditions-row" v-for="(value, key) in selectedCharacter.conditions" :key="key">
              <span>{{ this.$capitalizeFirstLetter(key) }}</span>
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
          </div>
        </div>

        <!--Equipment Table-->
        <EquipmentTable
          :equipment="selectedCharacter.equipment"
          :allEquipment="allEquipment"
          :character="selectedCharacter"
          @update-character="updateCharacter"
          @edit-custom-equipment="openEditEquipmentModal"
        />

        <!--Abilities Table-->
        <AbilitiesTable
          :character="selectedCharacter"
          :allAbilities="allAbilities"
          @update-character="updateCharacter"
        />

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
        :character="selectedCharacter"
        @close="closeChangeCharacterArtModal"
        @update-character="updateCharacter"
      />
      <SkillCheckModal
        v-if="showSkillCheckModal"
        :character="selectedCharacter"
        :selectedSkillName="selectedSkillName"
        @close="closeSkillCheckModal"
      />
      <SettingsModal
        v-if="showSettingsModal"
        @close="closeSettingsModal"
        @delete="openDeleteConfirmationModal"
      />
      <DeleteConfirmationModal
        v-if="showDeleteConfirmationModal"
        :name="selectedCharacter.name"
        @close="closeDeleteConfirmationModal"
        @confirm="deleteCharacter"
      />
      <EditEquipmentModal
        v-if="showEditEquipmentModal"
        :equipment="equipmentToEdit"
        @update="saveEditedEquipment"
        @close="closeEditEquipmentModal"
        @delete="deleteCustomEquipment"
      />

    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia';
import { useCharacterStore } from '@/stores/characterStore';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { useAbilitiesStore } from '@/stores/abilitiesStore';
import CharacterService from '@/services/CharacterService';
import EquipmentService from '@/services/EquipmentService';
import SelectionCard from '@/components/ConceptCard.vue';
import CharacterBioSection from '@/components/characterSheet/CharacterBioSection.vue';
import CoreAbilityColumn from '@/components/characterSheet/CoreAbilityColumn.vue';
import EquipmentTable from '@/components/characterSheet/EquipmentTable.vue';
import AbilitiesTable from '@/components/characterSheet/AbilitiesTable.vue';
import FullSizeCharacterArtModal from '@/components/modals/FullSizeCharacterArtModal.vue';
import ChangeCharacterArtModal from '@/components/modals/ChangeCharacterArtModal.vue';
import SkillCheckModal from '@/components/modals/SkillCheckModal.vue';
import CharacterSettingsModal from '@/components/modals/CharacterSettingsModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue';

export default {
  components: {
    SelectionCard,
    CharacterBioSection,
    CoreAbilityColumn,
    EquipmentTable,
    AbilitiesTable,
    FullSizeCharacterArtModal,
    ChangeCharacterArtModal,
    SkillCheckModal,
    SettingsModal: CharacterSettingsModal,
    DeleteConfirmationModal,
    EditEquipmentModal,
  },
  data() {
    const characterStore = useCharacterStore();
    const equipmentStore = useEquipmentStore();
    const abilitiesStore = useAbilitiesStore();
    return {
      characterStore,
      equipmentStore,
      abilitiesStore,
      showFullSizeCharacterArtModal: false,
      showChangeCharacterArtModal: false,
      showSkillCheckModal: false,
      showSettingsModal: false,
      showDeleteConfirmationModal: false,
      selectedCharacterArtUrl: '',
      selectedSkillName: '',
      updateTimeout: null,
      savingStatus: '',
      defaultArtUrl: CharacterService.DEFAULT_ART_URL,
      tempArtUrl: '',
      showEditEquipmentModal: false,
      equipmentToEdit: null,
    };
  },

  mounted() {
    this.characterStore.fetchCharacters();
    this.equipmentStore.fetchAllEquipment();
    this.abilitiesStore.fetchAllAbilities();
  },

  computed: {
    ...mapState(useCharacterStore, ['characters']),
    characters() {
      return this.characterStore.characters.filter(character => !character.isDeleted);
    },
    allEquipment() {
      return this.equipmentStore.equipment;
    },
    allAbilities() {
      return this.abilitiesStore.abilities;
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

    // CHARACTER SELECTION & CRUD
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
      const createdCharacter = await CharacterService.createCharacter();
      await this.characterStore.fetchCharacters();
      const newCharacter = this.characterStore.characters.find(
        (character) => character.id === createdCharacter.id
      );
        this.selectCharacter(newCharacter);
    },
    updateCharacter(updatedCharacter) {
      this.selectedCharacter = { ...updatedCharacter };
    },
    deleteCharacter() {
      CharacterService.deleteCharacter(this.selectedCharacter);
      this.closeDeleteConfirmationModal();
      this.deselectCharacter();
    },

    // MODAL CONTROLS
    closeAllModals() {
      this.showFullSizeCharacterArtModal = false;
      this.showChangeCharacterArtModal = false;
      this.showSkillCheckModal = false;
      this.showSettingsModal = false;
      this.showDeleteConfirmationModal = false;
    },
    openSettingsModal() {
      this.showSettingsModal = true;
    },
    closeSettingsModal() {
      this.showSettingsModal = false;
    },
    openDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = true;
    },
    closeDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = false;
    },
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
    openSkillCheckModal(skillName) {
      this.selectedSkillName = skillName;
      this.showSkillCheckModal = true;
    },
    closeSkillCheckModal() {
      this.showSkillCheckModal = false;
    },
    openEditEquipmentModal(equipment) {
      this.equipmentToEdit = equipment;
      this.showEditEquipmentModal = true;
    },
    closeEditEquipmentModal() {
      this.showEditEquipmentModal = false;
      this.equipmentToEdit = null;
    },

    // EQUIPMENT HANDLING
    async saveEditedEquipment(editedEquipment) {
      try {
        await EquipmentService.updateEquipment(editedEquipment);
        await this.equipmentStore.fetchAllEquipment();
        this.closeEditEquipmentModal();
      } catch (error) {
        console.error("Error saving equipment:", error);
      }
    },
    async deleteCustomEquipment(equipment) {
      try {
        // First, set isDeleted to true on the equipment
        equipment.isDeleted = true;
        
        // Update the equipment in the database
        await EquipmentService.updateEquipment(equipment);
        
        // Remove from character's equipment
        const equipmentIndex = this.selectedCharacter.equipment.findIndex(
          item => item.id === equipment.id
        );
        
        if (equipmentIndex >= 0) {
          this.selectedCharacter.equipment.splice(equipmentIndex, 1);
          this.$emit("update-character", this.selectedCharacter);
        }
        
        // Refresh equipment list
        await this.equipmentStore.fetchAllEquipment();
        
        // Close the modal
        this.closeEditEquipmentModal();
      } catch (error) {
        console.error("Error deleting custom equipment:", error);
      }
    },
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
  .add-concept-card {
    width: 250px;
    height: 300px;
    background: rgba(0, 0, 0, 0.4);
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 10px;
  }
  .add-concept-card:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
  .add-icon {
    font-size: 3rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 10px;
  }
  .add-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
  }
  
  /* CHARACTER SHEET */
  .character-sheet {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgb(17, 17, 17);
    border-radius: 5px;
    width: 80%;
    max-width: 1200px;
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

  /* CHARACTER STATS SECTION */
  .character-stats-section {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
    gap: 10px;
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
    background-color: black;
    border-radius: 5px;
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
    margin: 12px 0px;
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
    height: 25px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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

</style>
  