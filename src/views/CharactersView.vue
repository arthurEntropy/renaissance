<template>
  <div class="character-view">
    <!--CHARACTER SELECTION-->
    <div v-if="!selectedCharacter" class="character-selection">
      <div class="selection-cards-container">
        <SelectionCard v-for="character in characters" :key="character.id" :item="character"
          @click="selectCharacter(character)" :sources="sources" />

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
      <p class="close-button" @click="deselectCharacter">ⓧ</p>

      <!-- Top section with bio and dice results -->
      <div class="top-section">
        <!-- CHARACTER BIO SECTION-->
        <CharacterBioSection :character="selectedCharacter" :defaultArtUrl="defaultArtUrl || ''"
          @open-full-size-art="openFullSizeCharacterArtModal" @update-character="updateCharacter" />

        <!-- DICE ROLL RESULTS -->
        <DiceRollResults :latestRoll="latestRoll" />
      </div>

      <!-- CHARACTER STATS SECTION -->
      <div class="character-stats-section">
        <CoreAbilityColumn :character="selectedCharacter" column="body" @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal" />
        <CoreAbilityColumn :character="selectedCharacter" column="heart" @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal" />
        <CoreAbilityColumn :character="selectedCharacter" column="wits" @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal" />

        <!-- Conditions Column -->
        <div class="conditions-column-container">
          <div class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="conditions-row" v-for="(value, key) in selectedCharacter.conditions" :key="key">
              <span :class="{ 'condition-active': value }">{{
                this.$capitalizeFirstLetter(key)
              }}</span>
              <input type="checkbox" class="skill-checkbox" :class="{ 'condition-active-checkbox': value }"
                v-model="selectedCharacter.conditions[key]" />
            </div>
            <div class="conditions-row" style="border-bottom: none"></div>
          </div>
        </div>

        <!-- Three-column layout for Engagement, Equipment, and Abilities -->
        <div class="main-column">
          <EngagementDiceTable :character="selectedCharacter" :allEquipment="allEquipment" :sources="sources" />
        </div>
        <div class="main-column">
          <EquipmentTable :equipment="selectedCharacter.equipment" :allEquipment="allEquipment"
            :character="selectedCharacter" :sources="sources" @update-character="updateCharacter"
            @edit-custom-equipment="openEditEquipmentModal" />
        </div>
        <div class="main-column">
          <!-- Abilities Table -->
          <AbilitiesTable :character="selectedCharacter" :allAbilities="allAbilities" :sources="sources"
            @update-character="updateCharacter" />
        </div>
      </div>

      <!-- MODALS -->
      <FullSizeCharacterArtModal v-if="showFullSizeCharacterArtModal"
        :imageUrl="selectedCharacter.artUrls[0] || defaultArtUrl" @close="closeFullSizeCharacterArtModal"
        @change-art="openChangeCharacterArtModal" />

      <ChangeCharacterArtModal v-if="showChangeCharacterArtModal" :initialArtUrl="selectedCharacter.artUrls[0] || ''"
        :character="selectedCharacter" @close="closeChangeCharacterArtModal" @update-character="updateCharacter" />

      <SkillCheckModal v-if="showSkillCheckModal" :character="selectedCharacter" :selectedSkillName="selectedSkillName"
        :defaultTargetNumber="getLastTargetNumber()" @close="closeSkillCheckModal"
        @update-target-number="updateLastTargetNumber" />

      <SettingsModal v-if="showSettingsModal" @close="closeSettingsModal" @delete="openDeleteConfirmationModal" />

      <DeleteConfirmationModal v-if="showDeleteConfirmationModal" :name="selectedCharacter.name"
        @close="closeDeleteConfirmationModal" @confirm="deleteCharacter" />

      <EditEquipmentModal v-if="showEditEquipmentModal" :equipmentId="equipmentIdToEdit" :sources="sources"
        @update="saveEditedEquipment" @close="closeEditEquipmentModal" @delete="openDeleteConfirmationModal" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useCharacterStore } from '@/stores/characterStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import CharacterService from '@/services/CharacterService'
import EquipmentService from '@/services/EquipmentService'
import SelectionCard from '@/components/ConceptCard.vue'
import CharacterBioSection from '@/components/characterSheet/CharacterBioSection.vue'
import CoreAbilityColumn from '@/components/characterSheet/CoreAbilityColumn.vue'
import EquipmentTable from '@/components/characterSheet/EquipmentTable.vue'
import AbilitiesTable from '@/components/characterSheet/AbilitiesTable.vue'
import FullSizeCharacterArtModal from '@/components/modals/FullSizeCharacterArtModal.vue'
import ChangeCharacterArtModal from '@/components/modals/ChangeCharacterArtModal.vue'
import SkillCheckModal from '@/components/modals/SkillCheckModal.vue'
import CharacterSettingsModal from '@/components/modals/CharacterSettingsModal.vue'
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'
import EngagementDiceTable from '@/components/characterSheet/EngagementDiceTable.vue'
import DiceRollResults from '@/components/characterSheet/DiceRollResults.vue'
import DiceService from '@/services/DiceService'

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
    EngagementDiceTable,
    DiceRollResults,
  },
  data() {
    const characterStore = useCharacterStore()
    const equipmentStore = useEquipmentStore()
    const abilitiesStore = useAbilitiesStore()
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
      defaultArtUrl: CharacterService.DEFAULT_ART_URL,
      tempArtUrl: '',
      showEditEquipmentModal: false,
      equipmentIdToEdit: null,
      latestRoll: null,
      lastTargetNumber: null,
      sources: {
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      },
    }
  },

  async mounted() {
    try {
      // First fetch sources to ensure background images are available
      await this.fetchSources()

      // Then fetch other data in parallel
      await Promise.all([
        this.characterStore.fetchCharacters(),
        this.abilitiesStore.fetchAllAbilities(),
        this.equipmentStore.fetchAllEquipment()
      ]);
    } catch (error) {
      console.error('Error initializing CharactersView:', error);
    }
  },

  computed: {
    ...mapState(useCharacterStore, ['characters']),
    characters() {
      return this.characterStore.characters.filter(
        (character) => !character.isDeleted,
      )
    },
    allEquipment() {
      return this.equipmentStore.equipment
    },
    allAbilities() {
      return this.abilitiesStore.abilities
    },
    selectedCharacter: {
      get() {
        return this.characterStore.selectedCharacter
      },
      set(value) {
        this.characterStore.selectedCharacter = value
      },
    },
    getSelectedSkill() {
      return (
        this.selectedCharacter.skills.find(
          (skill) => skill.name === this.selectedSkillName,
        ) || {}
      )
    },
  },

  watch: {
    selectedCharacter: {
      handler(newCharacter) {
        if (!newCharacter) return
        clearTimeout(this.updateTimeout)
        this.updateTimeout = setTimeout(() => {
          CharacterService.saveCharacter(newCharacter)
        }, 500) // Only save after 0.5 seconds to avoid too many saves
      },
      deep: true,
    },

    // Changes to all these stats need to trigger recalculation of derived stats
    'selectedCharacter.body'() {
      if (!this.selectedCharacter || this.selectedCharacter.body === undefined)
        return // Null check
      CharacterService.handleBodyChange(this.selectedCharacter)
    },
    'selectedCharacter.heart'() {
      if (!this.selectedCharacter || this.selectedCharacter.heart === undefined)
        return // Null check
      CharacterService.handleHeartChange(this.selectedCharacter)
    },
    'selectedCharacter.wits'() {
      if (!this.selectedCharacter || this.selectedCharacter.wits === undefined)
        return // Null check
      CharacterService.handleWitsChange(this.selectedCharacter)
    },
    'selectedCharacter.endurance': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.endurance) return // Null check
        CharacterService.handleEnduranceChange(
          this.selectedCharacter,
          this.allEquipment,
        )
      },
      deep: true,
    },
    'selectedCharacter.hope': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.hope) return // Null check
        CharacterService.handleHopeChange(this.selectedCharacter)
      },
      deep: true,
    },
    'selectedCharacter.defense': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.defense) return // Null check
        CharacterService.handleDefenseChange(this.selectedCharacter)
      },
      deep: true,
    },
    'selectedCharacter.load'() {
      if (!this.selectedCharacter || this.selectedCharacter.load === undefined)
        return // Null check
      CharacterService.handleLoadChange(this.selectedCharacter)
    },
    'selectedCharacter.shadow'() {
      if (
        !this.selectedCharacter ||
        this.selectedCharacter.shadow === undefined
      )
        return // Null check
      CharacterService.handleShadowChange(this.selectedCharacter)
    },
    'selectedCharacter.injury'() {
      if (
        !this.selectedCharacter ||
        this.selectedCharacter.injury === undefined
      )
        return // Null check
      CharacterService.handleInjuryChange(this.selectedCharacter)
    },
    'selectedCharacter.states': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.states) return // Null check
        CharacterService.handleStatesChange(this.selectedCharacter)
      },
      deep: true,
    },
    'selectedCharacter.conditions': {
      handler() {
        if (!this.selectedCharacter || !this.selectedCharacter.conditions)
          return // Null check
        CharacterService.handleConditionsChange(this.selectedCharacter)
      },
      deep: true,
    },
    'selectedCharacter.equipment': {
      handler() {
        if (
          !this.selectedCharacter ||
          !this.selectedCharacter.equipment ||
          !this.allEquipment
        )
          return // Null check
        CharacterService.handleEquipmentChange(
          this.selectedCharacter,
          this.allEquipment,
        ) // Recalculate load
      },
      deep: true, // Ensure nested changes are detected
    },
  },

  methods: {
    // Fetch sources for both abilities and equipment
    async fetchSources() {
      try {
        // Fetch ability sources from abilitiesStore
        await this.abilitiesStore.fetchAllSources();

        // Fetch equipment sources from equipmentStore
        await this.equipmentStore.fetchAllSources();

        // Combine sources from both stores to ensure we have all sources
        // We'll prioritize the equipment store's sources but merge in any unique sources from abilities
        this.sources = {
          ancestries: [...this.equipmentStore.sources.ancestries],
          cultures: [...this.equipmentStore.sources.cultures],
          mestieri: [...this.equipmentStore.sources.mestieri],
          worldElements: [...this.equipmentStore.sources.worldElements]
        };
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    },

    // CHARACTER SELECTION & CRUD
    selectCharacter(character) {
      this.selectedCharacter = character
      this.characterStore.selectedCharacter = character
      this.closeAllModals()
    },
    deselectCharacter() {
      this.selectedCharacter = null
      this.characterStore.selectedCharacter = null
      this.latestRoll = null
      this.characterStore.fetchCharacters()
    },
    async createNewCharacter() {
      const createdCharacter = await CharacterService.createCharacter()
      await this.characterStore.fetchCharacters()
      const newCharacter = this.characterStore.characters.find(
        (character) => character.id === createdCharacter.id,
      )
      this.selectCharacter(newCharacter)
    },
    updateCharacter(updatedCharacter) {
      this.selectedCharacter = { ...updatedCharacter }
    },
    deleteCharacter() {
      CharacterService.deleteCharacter(this.selectedCharacter)
      this.closeDeleteConfirmationModal()
      this.deselectCharacter()
    },

    // MODAL CONTROLS
    closeAllModals() {
      this.showFullSizeCharacterArtModal = false
      this.showChangeCharacterArtModal = false
      this.showSkillCheckModal = false
      this.showSettingsModal = false
      this.showDeleteConfirmationModal = false
    },
    openSettingsModal() {
      this.showSettingsModal = true
    },
    closeSettingsModal() {
      this.showSettingsModal = false
    },
    openDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = true
    },
    closeDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = false
    },
    openFullSizeCharacterArtModal(imageUrl) {
      this.selectedCharacterArtUrl = imageUrl
      this.showFullSizeCharacterArtModal = true
    },
    closeFullSizeCharacterArtModal() {
      this.showFullSizeCharacterArtModal = false
    },
    openChangeCharacterArtModal() {
      this.tempArtUrl = this.selectedCharacter.artUrls[0] || ''
      this.showChangeCharacterArtModal = true
    },
    closeChangeCharacterArtModal() {
      this.showChangeCharacterArtModal = false
    },
    getLastTargetNumber() {
      return this.lastTargetNumber
    },

    updateLastTargetNumber(targetNumber) {
      this.lastTargetNumber = targetNumber
    },

    openSkillCheckModal(skillName) {
      this.selectedSkillName = skillName
      this.showSkillCheckModal = true
    },

    closeSkillCheckModal() {
      this.showSkillCheckModal = false
      this.updateLatestRoll() // Get latest roll when modal closes
    },
    openEditEquipmentModal(equipmentId) {
      this.equipmentIdToEdit = equipmentId
      this.showEditEquipmentModal = true
    },
    closeEditEquipmentModal() {
      this.showEditEquipmentModal = false
      this.equipmentToEdit = null
    },

    // EQUIPMENT HANDLING
    async saveEditedEquipment(updatedEquipment) {
      try {
        // Save the updated equipment to the backend
        await EquipmentService.updateEquipment(updatedEquipment)

        // Refresh the equipment list to ensure the new item is included
        await this.equipmentStore.fetchAllEquipment()

        // Update the character's equipment
        this.updateCharacter(this.characterStore.selectedCharacter)
      } catch (error) {
        console.error('Error saving equipment:', error)
      }
    },
    async deleteCustomEquipment(equipment) {
      try {
        // First, set isDeleted to true on the equipment
        equipment.isDeleted = true

        // Update the equipment in the database
        await EquipmentService.updateEquipment(equipment)

        // Remove from character's equipment
        const equipmentIndex = this.selectedCharacter.equipment.findIndex(
          (item) => item.id === equipment.id,
        )

        if (equipmentIndex >= 0) {
          this.selectedCharacter.equipment.splice(equipmentIndex, 1)
          this.$emit('update-character', this.selectedCharacter)
        }

        // Refresh equipment list
        await this.equipmentStore.fetchAllEquipment()

        // Close the modal
        this.closeEditEquipmentModal()
      } catch (error) {
        console.error('Error deleting custom equipment:', error)
      }
    },
    // LATEST ROLL
    updateLatestRoll() {
      this.latestRoll = DiceService.getLatestRollResult()
    },
  },
}
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
  width: 1050px;
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
  z-index: 2;
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

/* CHARACTER STATS SECTION */
.character-stats-section {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
  gap: 10px;
}

.top-section {
  display: flex;
  width: 100%;
  gap: 10px;
  justify-content: space-between;
}

@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
    align-items: center;
  }
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
  margin: 0 20px 0 15px;
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
  height: 28px;
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

.condition-active {
  color: red;
  text-shadow: 0px 0px 5px red;
}

.condition-active-checkbox {
  box-shadow: 0px 0px 10px cyan;
}

.main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
}

@media (max-width: 768px) {
  .equipment-abilities-container {
    flex-direction: column;
  }

  .equipment-column,
  .abilities-column {
    width: 100%;
    max-width: none;
  }
}
</style>
