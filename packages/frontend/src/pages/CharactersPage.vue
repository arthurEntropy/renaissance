<template>
  <div class="character-view">
    <div v-if="!selectedCharacter" class="character-selection">
      <div class="selection-cards-container">
        <SelectionCard v-for="character in filteredCharacters" :key="character.id" :item="character"
          @click="handleSelectCharacter(character)" />

        <div class="add-concept-card" @click="createCharacter">
          <div class="add-icon">+</div>
          <div class="add-text">Add Character</div>
        </div>
      </div>
    </div>

    <div v-if="selectedCharacter" class="character-sheet">
      <div class="settings-icon" @click="openSettingsModal">⚙️</div>
      <p class="close-button" @click="handleDeselectCharacter">ⓧ</p>

      <div class="top-section">
        <CharacterBioSection :character="selectedCharacter" :defaultArtUrl="defaultArtUrl || ''"
          @open-full-size-art="openFullSizeCharacterArtModal" @update-character="updateCharacter" />

        <DiceRollResults :latestRoll="latestRoll" />
      </div>

      <div class="character-stats-section">
        <CoreAbilityColumn :character="selectedCharacter" column="body" @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal" />
        <CoreAbilityColumn :character="selectedCharacter" column="heart" @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal" />
        <CoreAbilityColumn :character="selectedCharacter" column="wits" @update-character="updateCharacter"
          @open-skill-check="openSkillCheckModal" />

        <ConditionsColumn :character="selectedCharacter" @update:character="updateCharacter" />

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
          <AbilitiesTable :character="selectedCharacter" :allAbilities="allAbilities"
            @update-character="updateCharacter" />
        </div>
      </div>

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
import SelectionCard from '@/components/ui/cards/ConceptCard.vue'
import CharacterBioSection from '@/components/features/characterSheet/CharacterBioSection.vue'
import CoreAbilityColumn from '@/components/features/characterSheet/CoreAbilityColumn.vue'
import ConditionsColumn from '@/components/features/characterSheet/ConditionsColumn.vue'
import EquipmentTable from '@/components/features/characterSheet/EquipmentTable.vue'
import AbilitiesTable from '@/components/features/characterSheet/AbilitiesTable.vue'
import FullSizeCharacterArtModal from '@/components/features/characterSheet/modals/FullSizeCharacterArtModal.vue'
import ChangeCharacterArtModal from '@/components/features/characterSheet/modals/ChangeCharacterArtModal.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import CharacterSettingsModal from '@/components/features/characterSheet/modals/CharacterSettingsModal.vue'
import DeleteConfirmationModal from '@/components/features/characterSheet/modals/DeleteConfirmationModal.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'
import EngagementDiceTable from '@/components/features/characterSheet/EngagementDiceTable.vue'
import DiceRollResults from '@/components/features/characterSheet/DiceRollResults.vue'

// Stores
const characterStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()

// Computed properties from stores
const filteredCharacters = computed(() => characterStore.filteredCharacters)
const allEquipment = computed(() => equipmentStore.equipment)
const allAbilities = computed(() => abilitiesStore.abilities)

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
  createCharacter,
  deleteCharacter,
  watchCharacterStats
} = useCharacterManagement(allEquipment)

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

const handleDeleteCharacter = () => {
  deleteCharacter(selectedCharacter.value)
  closeDeleteConfirmationModal()
}

const handleSelectCharacter = (character) => {
  selectCharacter(character)
  closeAllModals()
}

const handleDeselectCharacter = () => {
  deselectCharacter()
  latestRoll.value = null
}

const handleOpenChangeCharacterArtModal = () => {
  openChangeCharacterArtModal(selectedCharacter.value)
}

const closeAllModals = () => {
  closeFullSizeCharacterArtModal()
  closeChangeCharacterArtModal()
  closeSkillCheckModal()
  closeSettingsModal()
  closeDeleteConfirmationModal()
}

onMounted(async () => {
  try {
    watchCharacterStats()

    await Promise.all([
      characterStore.fetch(),
      abilitiesStore.fetch(),
      equipmentStore.fetch()
    ])
  } catch (error) {
    console.error('Error initializing CharactersPage:', error)
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
  padding-bottom: var(--space-xl);
}

.add-concept-card {
  width: 250px;
  height: 300px;
  background: var(--overlay-black-medium);
  border: 2px dashed var(--overlay-white-heavy);
  border-radius: var(--radius-10);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-all);
  margin: var(--space-md);
}

.add-concept-card:hover {
  background: var(--overlay-white-medium);
  border-color: var(--overlay-white-heavy);
}

.add-icon {
  font-size: var(--font-size-32);
  font-weight: var(--font-weight-light);
  color: var(--overlay-white-heavy);
  margin-bottom: var(--space-md);
}

.add-text {
  color: var(--overlay-white-heavy);
  font-size: var(--font-size-16);
}

/* CHARACTER SHEET */
.character-sheet {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--overlay-black-heavy);
  border-radius: var(--radius-5);
  width: 1050px;
  max-height: 100%;
  padding: var(--space-xl);
  position: relative;
}

@media (max-width: var(--breakpoint-sm)) {
  .character-sheet {
    width: 90%;
    padding: 0;
  }
}

.settings-icon {
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  font-size: var(--font-size-20);
  cursor: pointer;
  z-index: var(--z-raised);
}

.close-button {
  position: absolute;
  top: calc(-1 * var(--space-md));
  right: var(--space-lg);
  z-index: var(--z-modal);
  font-size: var(--font-size-20);
  text-decoration: none;
  color: var(--color-gray-medium);
  cursor: pointer;
}

/* CHARACTER STATS SECTION */
.character-stats-section {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
  gap: var(--space-md);
}

.top-section {
  display: flex;
  width: 100%;
  gap: var(--space-md);
  justify-content: space-between;
}

@media (max-width: var(--breakpoint-md)) {
  .top-section {
    flex-direction: column;
    align-items: center;
  }
}

.main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
}

@media (max-width: var(--breakpoint-md)) {
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
