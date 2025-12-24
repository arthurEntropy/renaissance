<template>
  <CharacterSheetSection max-width="325px">

    <TableHeader title="Engagement" :is-edit-mode="internalEditMode" :show-edit-button="props.canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <div v-if="props.canEdit" class="button-group">
          <ActionButton variant="neutral" size="small" text="Reset" :disabled="internalEditMode || !hasExpendedDice"
            aria-label="Reset all expended engagement dice to available status" @click="resetDice" />
          <ActionButton variant="primary" size="small" text="Roll" :disabled="internalEditMode"
            aria-label="Roll selected engagement dice and enter engagement" @click="rollSelectedDice" />
        </div>
      </template>
    </TableHeader>

    <EngagementRollModal v-if="showEngagementRollModal" @close="closeEngagementRollModal" />

    <EngagementDiceDisplay :isEditMode="internalEditMode" />

    <EngagementSuccessDisplay :isEditMode="internalEditMode" />

  </CharacterSheetSection>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import EngagementRollModal from '@/components/features/characterSheet/rollModal/EngagementRollModal.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import EngagementDiceDisplay from './EngagementDiceDisplay.vue'
import EngagementSuccessDisplay from './EngagementSuccessDisplay.vue'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { DiceStatus } from '@/constants/diceStatus'

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false
  }
})

const internalEditMode = ref(false)
const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const diceManager = useEngagementRoll()
const successManager = useEngagementSuccesses()

// Local UI state
const showEngagementRollModal = ref(false)

// Reactive references from composables
const hasExpendedDice = diceManager.hasExpendedDice
const resetDice = diceManager.resetDice

const rollSelectedDice = () => {
  const selectedDice = diceManager.allOwnedEngagementDice.value
    .filter(item => item.status === DiceStatus.SELECTED)
    .map(item => ({ dieSides: item.die }))

  if (selectedDice.length === 0) {
    if (!confirm('Enter engagement with no dice selected?')) {
      return
    }
  }

  // Store dice in diceManager so modal can access them
  diceManager.committedDice.value = selectedDice
  showEngagementRollModal.value = true
}

const closeEngagementRollModal = () => {
  showEngagementRollModal.value = false
}

onMounted(async () => {
  await successManager.fetchEngagementSuccesses()
})
</script>

<style scoped>
.button-group {
  display: flex;
  gap: var(--space-sm);
}
</style>
