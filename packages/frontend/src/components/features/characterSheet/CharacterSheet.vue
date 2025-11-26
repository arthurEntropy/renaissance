<template>
    <div class="modal-overlay" @click.self="handleClose">
        <div class="character-sheet-header">
            <div class="settings-icon" @click="openSettingsModal">⚙️</div>
        </div>

        <!-- Character Sheet Content -->
        <div class="modal-content, modal-content-base">
            <div class="scrollable-wrapper">
                <div class="scrollable-content">
                    <div class="top-section">
                        <CharacterProfile :character="localCharacter" :is-edit-mode="isEditMode"
                            @update-character="updateCharacter" />
                        <CharacterBio :character="localCharacter" :is-edit-mode="isEditMode"
                            @update-character="updateCharacter" />
                        <DiceRollResults :latestRoll="latestRoll" :customDiceRollerOpen="showCustomDiceRoller"
                            :is-edit-mode="isEditMode" @toggle-custom-dice="toggleCustomDiceRoller"
                            @reroll-all-dice="handleRerollDice" />
                    </div>

                    <div class="character-stats-section">
                        <CoreAbilityColumn :character="localCharacter" :is-edit-mode="isEditMode" column="body"
                            @update-character="updateCharacter" @open-skill-check="openSkillCheckModal" />
                        <CoreAbilityColumn :character="localCharacter" :is-edit-mode="isEditMode" column="heart"
                            @update-character="updateCharacter" @open-skill-check="openSkillCheckModal" />
                        <CoreAbilityColumn :character="localCharacter" :is-edit-mode="isEditMode" column="wits"
                            @update-character="updateCharacter" @open-skill-check="openSkillCheckModal" />
                        <ConditionsColumn :character="localCharacter" :is-edit-mode="isEditMode"
                            @update:character="updateCharacter" />
                        <EquipmentTable :equipment="localCharacter.equipment" :allEquipment="allEquipment"
                            :character="localCharacter" :is-edit-mode="isEditMode" @update-character="updateCharacter"
                            @edit-custom-equipment="openEditEquipmentModal" />
                        <AbilitiesTable :character="localCharacter" :allAbilities="allAbilities"
                            :is-edit-mode="isEditMode" @update-character="updateCharacter" />
                        <EngagementTable :character="localCharacter" :allEquipment="allEquipment"
                            :is-edit-mode="isEditMode" @update:character="updateCharacter"
                            @engagement-results="handleEngagementResult" />
                    </div>
                </div>
            </div>

            <!-- Pop-out Custom Dice Roller -->
            <transition name="slide-fade">
                <CustomDiceRoller v-if="showCustomDiceRoller" :character="localCharacter"
                    @update-character="updateCharacter" @custom-roll="handleCustomRollResult"
                    class="pop-out-dice-roller" />
            </transition>
        </div>

        <!-- Modals -->
        <SkillCheckModal v-if="showSkillCheckModal" :character="localCharacter" :selectedSkillName="selectedSkillName"
            :defaultTargetNumber="getLastTargetNumber()" @close="closeSkillCheckModalAndUpdate"
            @update-target-number="updateLastTargetNumber" @skill-check-result="handleSkillCheckResult"
            @opposed-skill-check-result="handleOpposedSkillCheckResult"
            @start-opposed-skill-check="handleStartOpposedSkillCheck" />

        <OpposedSkillCheckModal v-if="showOpposedSkillCheckModal" :character="localCharacter"
            :session-manager="sessionManager" @close="closeOpposedSkillCheckModal"
            @skill-check-result="handleOpposedSkillCheckResult" />

        <CharacterSettingsModal v-if="showSettingsModal" :characterName="localCharacter.name"
            @close="closeSettingsModal" @delete="handleDeleteCharacter" />

        <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="allEquipment"
            :keeping-options="keepingStore.keeping" :sources="sources" :equipment-types="equipmentTypesStore.items"
            :equipment-subtypes="equipmentSubtypesStore.items" :equipment-grades="equipmentGradesStore.items"
            :engagement-success-options="engagementSuccessOptions" @update="saveEditedEquipment"
            @close="closeEditEquipmentModal" @delete="deleteEquipment" />
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useModal } from '@/composables/useModal'
import { useSkillCheck } from '@/composables/useSkillCheck'
import { useOpposedSkillCheck } from '@/composables/useOpposedSkillCheck'
import { useDiceResults } from '@/composables/useDiceResults'
import { useEquipmentManagement } from '@/composables/useEquipmentManagement'
import { useCharacterManagement } from '@/composables/useCharacterManagement'
import { useCharacterEditMode } from '@/composables/useCharacterEditMode'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import CharacterProfile from '@/components/features/characterSheet/characterProfile/CharacterProfile.vue'
import CharacterBio from '@/components/features/characterSheet/characterBio/CharacterBio.vue'
import CoreAbilityColumn from '@/components/features/characterSheet/coreAbilityColumns/CoreAbilityColumn.vue'
import ConditionsColumn from '@/components/features/characterSheet/conditions/ConditionsColumn.vue'
import EquipmentTable from '@/components/features/characterSheet/equipmentTable/EquipmentTable.vue'
import AbilitiesTable from '@/components/features/characterSheet/abilitiesTable/AbilitiesTable.vue'
import EngagementTable from '@/components/features/characterSheet/engagementTable/EngagementTable.vue'
import DiceRollResults from '@/components/features/characterSheet/diceRollResults/DiceRollResults.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import OpposedSkillCheckModal from '@/components/features/characterSheet/rollModal/OpposedSkillCheckModal.vue'
import CharacterSettingsModal from '@/components/features/characterSheet/modals/CharacterSettingsModal.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import CustomDiceRoller from './customDiceRoller/CustomDiceRoller.vue'

const props = defineProps({
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

// Stores
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const keepingStore = useKeepingStore()
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources

// Reactive state for modal data
const engagementSuccessOptions = ref([])

// Character management with automatic watchers
const {
    selectedCharacter,
    updateCharacter: updateCharacterService,
    watchCharacterStats
} = useCharacterManagement(computed(() => props.allEquipment || []))

// Start watching for automatic state recalculation
watchCharacterStats()

// Use selectedCharacter as localCharacter for backward compatibility
const localCharacter = selectedCharacter

// Edit mode management - auto-enable if user has permission
const {
    isEditMode,
    canEdit,
    enableEditMode
} = useCharacterEditMode(localCharacter)

// Auto-enable edit mode if user has permission
if (canEdit.value) {
    enableEditMode()
}

// Modal management
const {
    isOpen: showSettingsModal,
    openModal: openSettingsModal,
    closeModal: closeSettingsModal
} = useModal()

// Skill check modal functionality
const {
    showSkillCheckModal,
    selectedSkillName,
    openSkillCheckModal,
    closeSkillCheckModal,
    getLastTargetNumber,
    updateLastTargetNumber
} = useSkillCheck()

// Opposed skill check modal management
const { showOpposedSkillCheckModal, sessionManager } = useOpposedSkillCheck()

const closeOpposedSkillCheckModal = () => {
    sessionManager.disconnect()
    showOpposedSkillCheckModal.value = false
}

// Dice results management
const {
    latestRoll,
    handleSkillCheckResult,
    handleEngagementResult,
    handleOpposedSkillCheckResult: handleOpposedSkillCheckResultFromService,
    handleCustomRollResult
} = useDiceResults()

// Close skill check modal handler
const closeSkillCheckModalAndUpdate = () => {
    closeSkillCheckModal()
}

// Opposed skill check result handler
const handleOpposedSkillCheckResult = (result) => {
    handleOpposedSkillCheckResultFromService(result)
    closeSkillCheckModal()
}

// Handler for starting opposed skill check from SkillCheckModal
const handleStartOpposedSkillCheck = ({ character, skillCheckConfig }) => {
    // Close the skill check modal
    closeSkillCheckModal()

    // Start the opposed skill check session
    sessionManager.initializeSession(
        character,
        skillCheckConfig,
        null, // resultIndicatorCallback - not needed for basic implementation
        null, // dieRerolledCallback - not needed for basic implementation
        (result) => {
            // Handle the final result
            handleOpposedSkillCheckResultFromService(result)
        }
    )

    // Show the opposed skill check modal
    showOpposedSkillCheckModal.value = true
}

// Custom dice roller management
const showCustomDiceRoller = ref(false)

const toggleCustomDiceRoller = () => {
    showCustomDiceRoller.value = !showCustomDiceRoller.value
}

// Reroll dice handler
const handleRerollDice = () => {
    const currentRoll = latestRoll.value
    if (!currentRoll || !currentRoll._rerollData) {
        console.warn('Cannot reroll - no reroll data available')
        return
    }

    // Handle different roll types
    if (currentRoll.type === 'skill_check') {
        const { skill, character, targetNumber } = currentRoll._rerollData
        import('@/services/rolls/skillCheckService').then(module => {
            const rollResult = module.default.makeSkillCheck(skill, character, targetNumber)
            latestRoll.value = rollResult
        })
    } else if (currentRoll.type === 'custom_roll') {
        const { dicePool, modifier, character } = currentRoll._rerollData
        import('@/services/rolls/customRollService').then(module => {
            const rollResult = module.default.makeCustomRoll(dicePool, modifier, character)
            latestRoll.value = rollResult
        })
    } else {
        console.warn(`Reroll not supported for roll type: ${currentRoll.type}`)
    }
}

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
    // Always allow UI state updates (collapsed/showImprovements)
    // Only require edit mode for actual character data changes
    const isUIStateUpdate = updatedCharacter.abilities?.some((ability, index) => {
        const oldAbility = localCharacter.value.abilities?.[index]
        if (!oldAbility) return false

        const oldId = typeof oldAbility === 'string' ? oldAbility : oldAbility.id
        const newId = typeof ability === 'string' ? ability : ability.id

        // If it's the same ability with only UI state changes, allow it
        return oldId === newId &&
            (ability.collapsed !== oldAbility.collapsed ||
                ability.showImprovements !== oldAbility.showImprovements)
    })

    // Block non-UI updates when not in edit mode
    if (!isEditMode.value && !isUIStateUpdate) return

    // Use the character management service which triggers automatic watchers
    updateCharacterService(updatedCharacter)
    emit('update:character', updatedCharacter)
}

// Fetch engagement success options for equipment modal
const fetchEngagementSuccessOptions = async () => {
    try {
        engagementSuccessOptions.value = await EngagementSuccessService.getAll()
    } catch (error) {
        console.error('Error fetching engagement success options:', error)
    }
}

// Lifecycle
onMounted(async () => {
    try {
        await keepingStore.fetch()
        await Promise.all([
            equipmentTypesStore.fetch(),
            equipmentSubtypesStore.fetch(),
            equipmentGradesStore.fetch()
        ])
        await fetchEngagementSuccessOptions()
    } catch (error) {
        console.error('Error initializing CharacterSheet data:', error)
    }
})

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
.character-sheet-header {
    position: absolute;
    top: var(--space-md);
    left: var(--space-md);
    right: var(--space-md);
    display: flex;
    justify-content: flex-end;
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
    overflow: visible;
    /* Keep visible for dice roller positioning */
    position: relative;
    margin-top: -7px;
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    max-height: calc(100vh - 2 * var(--space-lg));
    /* Ensure modal fits in viewport */
}

.scrollable-wrapper {
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: visible;
    /* Allow horizontal overflow for any wide content */
}

.scrollable-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: var(--space-lg);
    /* Add bottom padding for scroll clearance */
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
    align-items: flex-start;
}

@media (max-width: var(--breakpoint-lg)) {
    .character-stats-section {
        gap: var(--space-md);
    }
}

.pop-out-dice-roller {
    position: absolute;
    top: 15px;
    right: -105px;
    z-index: var(--z-interactive);
    border-radius: var(--radius-5);
    background: var(--color-bg-secondary);
}

/* Slide-fade transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all var(--transition-normal);
}

.slide-fade-enter-from {
    transform: translateX(-30%);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateX(-30%);
    opacity: 0;
}

@media (max-width: var(--breakpoint-sm)) {
    .modal-content-base {
        margin: 0;
        max-height: 100vh;
        border-radius: 0;
        padding: var(--space-md);
    }

    .scrollable-wrapper {
        max-height: calc(100vh - 2 * var(--space-md));
    }
}
</style>
