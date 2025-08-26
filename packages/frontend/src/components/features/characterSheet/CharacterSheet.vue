<template>
    <div class="modal-overlay" @click.self="handleClose">
        <div class="character-sheet-header">
            <div class="settings-icon" @click="openSettingsModal">⚙️</div>
        </div>

        <!-- Character Sheet Content -->
        <div class="modal-content, modal-content-base">
            <div class="top-section">
                <DiceRollResults :latestRoll="latestRoll" />
                <CharacterProfile :character="localCharacter" @update-character="updateCharacter" />
                <CharacterBio :character="localCharacter" @update-character="updateCharacter" />
            </div>

            <div class="character-stats-section">
                <CoreAbilityColumn :character="localCharacter" column="body" @update-character="updateCharacter"
                    @open-skill-check="openSkillCheckModal" />
                <CoreAbilityColumn :character="localCharacter" column="heart" @update-character="updateCharacter"
                    @open-skill-check="openSkillCheckModal" />
                <CoreAbilityColumn :character="localCharacter" column="wits" @update-character="updateCharacter"
                    @open-skill-check="openSkillCheckModal" />
                <ConditionsColumn :character="localCharacter" @update:character="updateCharacter" />
                <EngagementTable :character="localCharacter" :allEquipment="allEquipment"
                    @update:character="updateCharacter" @engagement-results="handleEngagementResults" />
                <EquipmentTable :equipment="localCharacter.equipment" :allEquipment="allEquipment"
                    :character="localCharacter" @update-character="updateCharacter"
                    @edit-custom-equipment="openEditEquipmentModal" />
                <AbilitiesTable :character="localCharacter" :allAbilities="allAbilities"
                    @update-character="updateCharacter" />
            </div>
        </div>

        <!-- Modals -->
        <SkillCheckModal v-if="showSkillCheckModal" :character="localCharacter" :selectedSkillName="selectedSkillName"
            :defaultTargetNumber="getLastTargetNumber()" @close="closeSkillCheckModal"
            @update-target-number="updateLastTargetNumber" />

        <CharacterSettingsModal v-if="showSettingsModal" :characterName="localCharacter.name"
            @close="closeSettingsModal" @delete="handleDeleteCharacter" />

        <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
            @close="closeEditEquipmentModal" @delete="deleteEquipment" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useModal } from '@/composables/useModal'
import { useSkillCheck } from '@/composables/useSkillCheck'
import { useEquipmentManagement } from '@/composables/useEquipmentManagement'
import CharacterProfile from '@/components/features/characterSheet/characterProfile/CharacterProfile.vue'
import CharacterBio from '@/components/features/characterSheet/characterBio/CharacterBio.vue'
import CoreAbilityColumn from '@/components/features/characterSheet/coreAbilityColumns/CoreAbilityColumn.vue'
import ConditionsColumn from '@/components/features/characterSheet/conditions/ConditionsColumn.vue'
import EquipmentTable from '@/components/features/characterSheet/equipmentTable/EquipmentTable.vue'
import AbilitiesTable from '@/components/features/characterSheet/abilitiesTable/AbilitiesTable.vue'
import EngagementTable from '@/components/features/characterSheet/engagementTable/EngagementTable.vue'
import DiceRollResults from '@/components/features/characterSheet/diceRollResults/DiceRollResults.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import CharacterSettingsModal from '@/components/features/characterSheet/modals/CharacterSettingsModal.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'

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
    saveEditedEquipment,
    deleteEquipment
} = useEquipmentManagement()

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
    closeSettingsModal()
    handleClose()
}
</script>

<style scoped>
.modal-content {
    max-width: 1275px;
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
    padding: var(--space-sm);
    border-radius: var(--radius-3);
    transition: var(--transition-color);
    z-index: var(--z-raised);
}

.settings-icon:hover {
    color: var(--color-primary);
    background-color: var(--overlay-white-subtle);
}

.modal-content-base {
    background: var(--overlay-black-heavy);
    border-radius: var(--radius-5);
    max-width: 1200px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    margin-top: 20px;
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.top-section {
    display: flex;
    width: 100%;
    gap: var(--space-lg);
    justify-content: center;
    margin-bottom: var(--space-lg);
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
    gap: var(--space-lg);
}

@media (max-width: var(--breakpoint-lg)) {
    .character-stats-section {
        gap: var(--space-md);
    }
}

@media (max-width: var(--breakpoint-sm)) {
    .modal-content-base {
        margin: 0;
        max-height: 100vh;
        border-radius: 0;
        padding: var(--space-md);
    }
}
</style>
