<template>
  <CharacterSheetSection max-width="325px">

    <TableHeader title="Engagement" :is-edit-mode="internalEditMode" :show-edit-button="canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <div class="button-group">
          <ActionButton variant="neutral" size="small" text="Reset" :disabled="internalEditMode || !hasExpendedDice"
            @click="resetDice" />
          <ActionButton variant="primary" size="small" text="Roll" :disabled="internalEditMode"
            @click="rollSelectedDice" />
        </div>
      </template>
    </TableHeader>

    <EngagementRollModal v-if="showEngagementRollModal" :character="character" :selectedDice="currentRollDice"
      :allEngagementSuccesses="allEngagementSuccesses" :allEquipment="allEquipment" @close="closeEngagementRollModal"
      @engagement-committed="handleEngagementCommitted" @engagement-results="handleEngagementResults" />

    <EngagementDiceDisplay :diceData="allOwnedEngagementDice" :diceOptions="diceOptions" :isEditMode="internalEditMode"
      :showDropdown="showDiceDropdown" :dropdownPosition="diceDropdownPosition" @toggle-dice="toggleDiceStatus"
      @remove-die="removeUserAddedDie" @add-die="toggleDiceDropdown" @select-die="addUserAddedDie" />

    <EngagementSuccessDisplay :successData="allOwnedEngagementSuccesses"
      :availableSuccesses="availableEngagementSuccesses" :isEditMode="internalEditMode"
      :showDropdown="showSuccessDropdown" :dropdownPosition="successDropdownPosition"
      @remove-success="removeUserAddedSuccess" @add-success="toggleSuccessDropdown"
      @select-success="addUserAddedSuccess" />

  </CharacterSheetSection>
</template>

<script setup>
import { ref, toRef, computed } from 'vue'
import EngagementRollModal from '@/components/features/characterSheet/rollModal/EngagementRollModal.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import EngagementDiceDisplay from './EngagementDiceDisplay.vue'
import EngagementSuccessDisplay from './EngagementSuccessDisplay.vue'
import { useTableEditMode } from '@/composables/useTableEditMode'
import { useEngagementDice } from '@/composables/useEngagementDice'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { useDropdown } from '@/composables/useDropdown'

// Props
const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  allEquipment: {
    type: Array,
    default: () => [],
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:character', 'engagement-results'])

// Internal edit mode management
const { isEditMode: internalEditMode, toggleEditMode } = useTableEditMode()

// Character sheet edit mode only controls whether edit button is visible
const canEdit = computed(() => props.isEditMode)

// Initialize composable with reactive references
const characterRef = toRef(props, 'character')
const allEquipmentRef = toRef(props, 'allEquipment')

const diceManager = useEngagementDice(characterRef, allEquipmentRef)
const successManager = useEngagementSuccesses(characterRef, allEquipmentRef)

// UI composables
const diceDropdown = useDropdown()
const successDropdown = useDropdown()

// Local UI state
const diceOptions = ref([4, 6, 8, 10, 12, 20])
const showEngagementRollModal = ref(false)
const currentRollDice = ref([])

// Reactive references from composables
const allOwnedEngagementDice = diceManager.allOwnedEngagementDice
const hasExpendedDice = diceManager.hasExpendedDice
const toggleDiceStatus = diceManager.toggleDiceStatus
const resetDice = diceManager.resetDice
const allEngagementSuccesses = successManager.allEngagementSuccesses
const allOwnedEngagementSuccesses = successManager.allOwnedEngagementSuccesses
const availableEngagementSuccesses = successManager.availableEngagementSuccesses
const showDiceDropdown = diceDropdown.isOpen
const showSuccessDropdown = successDropdown.isOpen
const diceDropdownPosition = diceDropdown.position
const successDropdownPosition = successDropdown.position

// Methods
const updateCharacter = (updatedCharacter) => {
  emit('update:character', updatedCharacter)
}

const rollSelectedDice = () => {
  const selectedDice = [...diceManager.selectedDiceValues.value]

  if (selectedDice.length === 0) {
    if (!confirm('Enter engagement with no dice selected?')) {
      return
    }
  }

  currentRollDice.value = selectedDice
  showEngagementRollModal.value = true
}

const closeEngagementRollModal = () => {
  showEngagementRollModal.value = false
}

const handleEngagementCommitted = () => {
  diceManager.markSelectedDiceAsExpended()
}

const handleEngagementResults = (engagementResult) => {
  emit('engagement-results', engagementResult)
}

const toggleDiceDropdown = (event) => {
  successDropdown.close()
  diceDropdown.toggle(event, '.dice-dropdown', '.add-die-container button')
}

const addUserAddedDie = (die) => {
  diceManager.addUserAddedDie(die, updateCharacter)
  diceDropdown.close()
}

const removeUserAddedDie = (index) => {
  diceManager.removeUserAddedDie(index, updateCharacter)
}

const toggleSuccessDropdown = (event) => {
  diceDropdown.close()
  successDropdown.toggle(event, '.success-dropdown', '.add-success-container button')
}

const addUserAddedSuccess = (successId) => {
  successManager.addUserAddedSuccess(successId, updateCharacter)
  successDropdown.close()
}

const removeUserAddedSuccess = (successId) => {
  successManager.removeUserAddedSuccess(successId, updateCharacter)
}

// Initialize success data
successManager.fetchEngagementSuccesses()
</script>

<style scoped>
.button-group {
  display: flex;
  gap: var(--space-sm);
}

.engagement-dice-content {
  width: 100%;
}
</style>
