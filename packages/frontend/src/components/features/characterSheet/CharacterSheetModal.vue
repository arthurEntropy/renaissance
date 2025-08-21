<template>
    <div class="modal-overlay" @click.self="handleClose">
        <!-- Character Sheet Header -->
        <div class="character-sheet-header">
            <div class="settings-icon" @click="openSettingsModal">⚙️</div>
        </div>

        <div class="modal-content-base character-sheet-content">
            <div class="top-section">
                <CharacterBioSection :character="localCharacter" :defaultArtUrl="defaultArtUrl || ''"
                    @open-full-size-art="openFullSizeCharacterArtModal" @update-character="updateCharacter" />

                <DiceRollResults :latestRoll="latestRoll" />
            </div>

            <div class="character-stats-section">
                <CoreAbilityColumn :character="localCharacter" column="body" @update-character="updateCharacter"
                    @open-skill-check="openSkillCheckModal" />
                <CoreAbilityColumn :character="localCharacter" column="heart" @update-character="updateCharacter"
                    @open-skill-check="openSkillCheckModal" />
                <CoreAbilityColumn :character="localCharacter" column="wits" @update-character="updateCharacter"
                    @open-skill-check="openSkillCheckModal" />

                <ConditionsColumn :character="localCharacter" @update:character="updateCharacter" />

                <div class="main-column">
                    <EngagementDiceTable :character="localCharacter" :allEquipment="allEquipment"
                        @update:character="updateCharacter" @engagement-results="handleEngagementResults" />
                </div>
                <div class="main-column">
                    <EquipmentTable :equipment="localCharacter.equipment" :allEquipment="allEquipment"
                        :character="localCharacter" @update-character="updateCharacter"
                        @edit-custom-equipment="openEditEquipmentModal" />
                </div>
                <div class="main-column">
                    <AbilitiesTable :character="localCharacter" :allAbilities="allAbilities"
                        @update-character="updateCharacter" />
                </div>
            </div>
        </div>

        <!-- Character Sheet Modals -->
        <FullSizeCharacterArtModal v-if="showFullSizeCharacterArtModal"
            :imageUrl="localCharacter.artUrls[0] || defaultArtUrl" @close="closeFullSizeCharacterArtModal"
            @change-art="handleOpenChangeCharacterArtModal" />

        <ChangeCharacterArtModal v-if="showChangeCharacterArtModal" :initialArtUrl="localCharacter.artUrls[0] || ''"
            :character="localCharacter" @close="closeChangeCharacterArtModal" @update-character="updateCharacter" />

        <SkillCheckModal v-if="showSkillCheckModal" :character="localCharacter" :selectedSkillName="selectedSkillName"
            :defaultTargetNumber="getLastTargetNumber()" @close="closeSkillCheckModal"
            @update-target-number="updateLastTargetNumber" />

        <CharacterSettingsModal v-if="showSettingsModal" @close="closeSettingsModal"
            @delete="openDeleteConfirmationModal" />

        <DeleteConfirmationModal v-if="showDeleteConfirmationModal" :name="localCharacter.name"
            @close="closeDeleteConfirmationModal" @confirm="handleDeleteCharacter" />

        <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
            @close="closeEditEquipmentModal" @delete="openDeleteConfirmationModal" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useModal } from '@/composables/useModal'
import { useSkillCheck } from '@/composables/useSkillCheck'
import { useEquipmentManagement } from '@/composables/useEquipmentManagement'
import { useCharacterArt } from '@/composables/useCharacterArt'
import CharacterBioSection from '@/components/features/characterSheet/CharacterBioSection.vue'
import CoreAbilityColumn from '@/components/features/characterSheet/CoreAbilityColumn.vue'
import ConditionsColumn from '@/components/features/characterSheet/ConditionsColumn.vue'
import EquipmentTable from '@/components/features/characterSheet/EquipmentTable.vue'
import AbilitiesTable from '@/components/features/characterSheet/AbilitiesTable.vue'
import EngagementDiceTable from '@/components/features/characterSheet/EngagementDiceTable.vue'
import DiceRollResults from '@/components/features/characterSheet/DiceRollResults.vue'
import FullSizeCharacterArtModal from '@/components/features/characterSheet/modals/FullSizeCharacterArtModal.vue'
import ChangeCharacterArtModal from '@/components/features/characterSheet/modals/ChangeCharacterArtModal.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import CharacterSettingsModal from '@/components/features/characterSheet/modals/CharacterSettingsModal.vue'
import DeleteConfirmationModal from '@/components/features/characterSheet/modals/DeleteConfirmationModal.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'

const props = defineProps({
    character: {
        type: Object,
        required: true
    },
    allEquipment: {
        type: Array,
        default: () => []
    },
    allAbilities: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['close', 'update:character', 'delete:character'])

// Local character state for immediate updates
const localCharacter = ref({ ...props.character })

// Watch for prop changes and sync local state
watch(() => props.character, (newCharacter) => {
    localCharacter.value = { ...newCharacter }
}, { deep: true })

// Modal management
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

// Skill check functionality
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

// Equipment management
const {
    showEditEquipmentModal,
    equipmentToEdit,
    openEditEquipmentModal,
    closeEditEquipmentModal,
    saveEditedEquipment
} = useEquipmentManagement()

// Character art functionality
const {
    showFullSizeCharacterArtModal,
    showChangeCharacterArtModal,
    defaultArtUrl,
    openFullSizeCharacterArtModal,
    closeFullSizeCharacterArtModal,
    openChangeCharacterArtModal,
    closeChangeCharacterArtModal
} = useCharacterArt()

// Character update handler
const updateCharacter = (updatedCharacter) => {
    localCharacter.value = { ...updatedCharacter }
    emit('update:character', updatedCharacter)
}

// Modal close handler
const handleClose = () => {
    emit('close')
}

// Delete character handler
const handleDeleteCharacter = () => {
    emit('delete:character', localCharacter.value)
    closeDeleteConfirmationModal()
    handleClose()
}

// Open change art modal handler
const handleOpenChangeCharacterArtModal = () => {
    openChangeCharacterArtModal(localCharacter.value)
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--overlay-black-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    overflow-y: auto;
    padding: var(--space-md);
}

.character-sheet-header {
    position: absolute;
    top: var(--space-md);
    left: var(--space-md);
    right: var(--space-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: var(--z-modal-controls);
}

.settings-icon {
    font-size: var(--font-size-20);
    cursor: pointer;
    color: var(--color-text-primary);
    z-index: var(--z-raised);
}

.modal-content-base {
    background: var(--overlay-black-heavy);
    border-radius: var(--radius-5);
    max-width: 1200px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    margin-top: calc(var(--space-xl) * 2);
}

.character-sheet-content {
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.top-section {
    display: flex;
    width: 100%;
    gap: var(--space-md);
    justify-content: space-between;
    margin-bottom: var(--space-md);
}

@media (max-width: var(--breakpoint-md)) {
    .top-section {
        flex-direction: column;
        align-items: center;
    }
}

.character-stats-section {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
    gap: var(--space-md);
}

.main-column {
    display: flex;
    flex-direction: column;
    flex: 1;
}

@media (max-width: var(--breakpoint-sm)) {
    .modal-content-base {
        margin: 0;
        max-height: 100vh;
        border-radius: 0;
    }

    .character-sheet-content {
        padding: var(--space-md);
    }
}
</style>
