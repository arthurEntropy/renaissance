<template>
  <div class="character-view">
    <!--CHARACTER SELECTION-->
    <div v-if="!selectedCharacter" class="character-selection">
      <div class="selection-cards-container">
        <SelectionCard v-for="character in filteredCharacters" :key="character.id" :item="character"
          @click="handleSelectCharacter(character)" />

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
      <p class="close-button" @click="handleDeselectCharacter">ⓧ</p>

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
                cap(key)
                }}</span>
              <input type="checkbox" class="skill-checkbox" :class="{ 'condition-active-checkbox': value }"
                v-model="selectedCharacter.conditions[key]" />
            </div>
            <div class="conditions-row" style="border-bottom: none"></div>
          </div>
        </div>

        <!-- Three-column layout for Engagement, Equipment, and Abilities -->
        <div class="main-column">
          <EngagementDiceTable :character="selectedCharacter" :allEquipment="allEquipment"
            @update:character="updateCharacter" @engagement-results="handleEngagementResults" />
        </div>
        <div class="main-column">
          <EquipmentTable :equipment="selectedCharacter.equipment" :allEquipment="allEquipment"
            :character="selectedCharacter" @update-character="updateCharacter"
            @edit-custom-equipment="openEditEquipmentModal" />
        </div>
        <div class="main-column">
          <!-- Abilities Table -->
          <AbilitiesTable :character="selectedCharacter" :allAbilities="allAbilities"
            @update-character="updateCharacter" />
        </div>
      </div>

      <!-- MODALS -->
      <FullSizeCharacterArtModal v-if="showFullSizeCharacterArtModal"
        :imageUrl="selectedCharacter.artUrls[0] || defaultArtUrl" @close="closeFullSizeCharacterArtModal"
        @change-art="handleOpenChangeCharacterArtModal" />

      <ChangeCharacterArtModal v-if="showChangeCharacterArtModal" :initialArtUrl="selectedCharacter.artUrls[0] || ''"
        :character="selectedCharacter" @close="closeChangeCharacterArtModal" @update-character="updateCharacter" />

      <SkillCheckModal v-if="showSkillCheckModal" :character="selectedCharacter" :selectedSkillName="selectedSkillName"
        :defaultTargetNumber="getLastTargetNumber()" @close="closeSkillCheckModal"
        @update-target-number="updateLastTargetNumber" />

      <CharacterSettingsModal v-if="showSettingsModal" @close="closeSettingsModal"
        @delete="openDeleteConfirmationModal" />

      <DeleteConfirmationModal v-if="showDeleteConfirmationModal" :name="selectedCharacter.name"
        @close="closeDeleteConfirmationModal" @confirm="handleDeleteCharacter" />

      <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" @delete="openDeleteConfirmationModal" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useModal } from '@/composables/useModal'
import { useCharacterManagement } from '@/composables/useCharacterManagement'
import { useSkillCheck } from '@/composables/useSkillCheck'
import { useEquipmentManagement } from '@/composables/useEquipmentManagement'
import { useCharacterArt } from '@/composables/useCharacterArt'
import { capitalizeFirstLetter } from '../../utils/stringUtils'
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

// Stores
const characterStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()

// Local helpers
const cap = (s) => capitalizeFirstLetter(String(s || ''))

// Composables
const {
  isOpen: showSettingsModal,
  openModal: openSettingsModal,
  closeModal: closeSettingsModal
} = useModal()

const {
  isOpen: showDeleteConfirmationModal,
  openModal: openDeleteConfirmationModal,
  closeModal: closeDeleteConfirmationModal
} = useModal()

const {
  selectedCharacter,
  selectCharacter,
  deselectCharacter,
  updateCharacter,
  createNewCharacter,
  deleteCharacter,
  watchCharacterStats
} = useCharacterManagement(computed(() => equipmentStore.equipment))

const {
  showSkillCheckModal,
  selectedSkillName,
  latestRoll,
  openSkillCheckModal,
  closeSkillCheckModal,
  handleEngagementResults,
  getLastTargetNumber,
  updateLastTargetNumber
} = useSkillCheck()

const {
  showEditEquipmentModal,
  equipmentToEdit,
  openEditEquipmentModal,
  closeEditEquipmentModal,
  saveEditedEquipment
} = useEquipmentManagement()

const {
  showFullSizeCharacterArtModal,
  showChangeCharacterArtModal,
  defaultArtUrl,
  openFullSizeCharacterArtModal,
  closeFullSizeCharacterArtModal,
  openChangeCharacterArtModal,
  closeChangeCharacterArtModal
} = useCharacterArt()

// Computed properties
const filteredCharacters = computed(() => {
  return characterStore.characters.filter(
    (character) => !character.isDeleted,
  )
})

const allEquipment = computed(() => {
  return equipmentStore.equipment
})

const allAbilities = computed(() => {
  return abilitiesStore.abilities
})

// Enhanced delete character handler
const handleDeleteCharacter = () => {
  deleteCharacter(selectedCharacter.value)
  closeDeleteConfirmationModal()
}

// Enhanced character selection handler
const handleSelectCharacter = (character) => {
  selectCharacter(character)
  closeAllModals()
}

// Enhanced deselect character handler
const handleDeselectCharacter = () => {
  deselectCharacter()
  latestRoll.value = null
}

// Enhanced open change art modal handler
const handleOpenChangeCharacterArtModal = () => {
  openChangeCharacterArtModal(selectedCharacter.value)
}

// Modal close handler
const closeAllModals = () => {
  closeFullSizeCharacterArtModal()
  closeChangeCharacterArtModal()
  closeSkillCheckModal()
  closeSettingsModal()
  closeDeleteConfirmationModal()
}

// Lifecycle
onMounted(async () => {
  try {
    // Initialize character stat watchers
    watchCharacterStats()

    // Fetch data in parallel (sources will auto-fetch via useSources)
    await Promise.all([
      characterStore.fetchCharacters(),
      abilitiesStore.fetchAllAbilities(),
      equipmentStore.fetchAllEquipment()
    ])
  } catch (error) {
    console.error('Error initializing CharactersView:', error)
  }
})
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
  background: rgb(17, 17, 17, 0.75);
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
