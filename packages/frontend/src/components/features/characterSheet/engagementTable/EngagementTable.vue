<template>
  <CharacterSheetSection>

    <TableHeader title="Engagement" :is-edit-mode="internalEditMode" :show-edit-button="props.canEdit" collapsible
      :is-collapsed="isCollapsed" @toggle-collapse="isCollapsed = !isCollapsed" @toggle-edit="toggleEditMode">
      <template #header-center>
        <div v-if="diceInHeader" class="header-dice">
          <EngagementDiceDisplay :isEditMode="internalEditMode" />
        </div>
      </template>
      <template #header-right>
        <div v-if="props.canEdit" class="button-group">
          <ActionButton variant="neutral" size="small" text="Regain All"
            :disabled="internalEditMode || !hasExpendedDice"
            aria-label="Reset all expended engagement dice to available status" @click="resetDice" />
          <ActionButton variant="primary" size="small" text="Roll" :disabled="internalEditMode"
            aria-label="Roll selected engagement dice and enter engagement" @click="rollSelectedDice" />
        </div>
      </template>
    </TableHeader>

    <EngagementRollModal v-if="showEngagementRollModal" @close="closeEngagementRollModal" />

    <div v-if="!isCollapsed" class="engagement-content">
      <EngagementDiceDisplay v-if="!diceInHeader" :isEditMode="internalEditMode" />
      <EngagementSuccessDisplay :isEditMode="internalEditMode" />
    </div>

  </CharacterSheetSection>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

const emit = defineEmits(['close-sheet'])

const internalEditMode = ref(false)
const isCollapsed = ref(false)
const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const diceManager = useEngagementRoll()
const successManager = useEngagementSuccesses()

// Local UI state
const showEngagementRollModal = ref(false)

// Reactive references from composables
const hasExpendedDice = diceManager.hasExpendedDice
const resetDice = diceManager.resetDice

const INLINE_DICE_THRESHOLD = 8
const diceInHeader = computed(() => diceManager.allOwnedEngagementDice.value.length <= INLINE_DICE_THRESHOLD)

const rollSelectedDice = () => {
  const selectedDice = diceManager.allOwnedEngagementDice.value
    .filter(item => item.status === DiceStatus.SELECTED)
    .map(item => ({ dieSize: item.die }))

  if (selectedDice.length === 0) {
    if (!confirm('Enter engagement with no dice selected?')) {
      return
    }
  }

  // Store dice in diceManager so modal can access them
  diceManager.committedDice.value = selectedDice
  // Reset sort state so the new session's waiting-state dice are never stale
  diceManager.resetSortingState()
  showEngagementRollModal.value = true
}

const closeEngagementRollModal = () => {
  showEngagementRollModal.value = false
  emit('close-sheet')
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

.header-dice {
  display: flex;
  align-items: center;
  margin-top: var(--space-md);
}

.header-dice :deep(.dice-display) {
  margin-top: 0;
  flex-wrap: nowrap;
}

.engagement-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
</style>
