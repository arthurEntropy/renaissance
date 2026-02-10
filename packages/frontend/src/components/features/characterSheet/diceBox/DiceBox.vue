<template>
  <CharacterSheetSection custom-class="dice-box edit-hover-area" :min-width="`${CONTAINER_WIDTH}px`"
    :max-width="`${CONTAINER_WIDTH}px`">

    <FloatingActionButton v-if="canEdit && !customDiceRollerOpen" type="initiative" size="small" visibility="on-hover"
      class="initiative-button" @click="handleInitiativeRoll" />

    <FloatingActionButton v-if="canEdit" :type="customDiceRollerOpen ? 'delete' : 'dice'" size="small"
      visibility="on-hover" :is-active="customDiceRollerOpen" class="dice-roller-toggle"
      @click="toggleCustomDiceRoller" />

    <!-- Custom Dice Roller View -->
    <div v-show="customDiceRollerOpen" class="custom-roller-view view-container">
      <CustomDiceRoller @roll-complete="handleRollComplete" />
    </div>

    <!-- Roll Results Display -->
    <div v-show="!customDiceRollerOpen && latestRoll" class="roll-content view-container">
      <template v-if="latestRoll">
        <RollTitle :rollData="latestRoll" :isEngagement="isEngagement" :isOpposedSkillCheck="isOpposedSkillCheck"
          :isCustomRoll="isCustomRoll" :isInitiative="isInitiative" />

        <DiceDisplay ref="diceDisplayRef" :key="latestRoll?.timestamp" :rollData="latestRoll"
          :isEngagement="isEngagement" :canReroll="true" :isOpponent="false" :containerWidth="CONTAINER_WIDTH"
          @reroll-all-dice="rollsStore.reroll" />

        <RollOutcome :rollData="latestRoll" :isEngagement="isEngagement" :isOpposedSkillCheck="isOpposedSkillCheck"
          :isCustomRoll="isCustomRoll" :isInitiative="isInitiative" :isRolling="isRolling" />
      </template>
    </div>

    <!-- Empty State -->
    <div v-show="!customDiceRollerOpen && !latestRoll" class="empty-state-container view-container">
      <EmptyRollState />
    </div>

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RollTypes } from '@/constants/rollTypes'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import DiceDisplay from './DiceDisplay.vue'
import RollTitle from './RollTitle.vue'
import RollOutcome from './RollOutcome.vue'
import EmptyRollState from './EmptyRollState.vue'
import CustomDiceRoller from '../customDiceRoller/CustomDiceRoller.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'
import InitiativeRollService from '@/services/rolls/initiativeRollService'

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()

const diceDisplayRef = ref(null)

const CONTAINER_WIDTH = 310

const customDiceRollerOpen = ref(false)

const toggleCustomDiceRoller = () => {
  customDiceRollerOpen.value = !customDiceRollerOpen.value
}

const handleRollComplete = () => {
  customDiceRollerOpen.value = false
}

const handleInitiativeRoll = () => {
  const character = charactersStore.selectedCharacter
  if (!character) return

  const rollResult = InitiativeRollService.makeInitiativeRoll(character)
  rollsStore.setRoll(rollResult)
}

const canEdit = computed(() => charactersStore.canEditSelectedCharacter)
const latestRoll = computed(() => rollsStore.latestRoll)

const isEngagement = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.ENGAGEMENT
})

const isOpposedSkillCheck = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.OPPOSED_SKILL_CHECK
})

const isCustomRoll = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.CUSTOM_ROLL
})

const isInitiative = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.INITIATIVE
})

const isRolling = computed(() => {
  return diceDisplayRef.value?.isRolling || false
})
</script>

<style scoped>
.dice-box {
  position: relative;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.view-container {
  transition: opacity var(--duration-fast) var(--ease-standard);
}

.roll-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
}

.custom-roller-view {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.initiative-button {
  position: absolute;
  top: var(--space-md);
  right: calc(var(--space-md) + 36px);
  z-index: var(--z-raised);
}

.dice-roller-toggle {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  z-index: var(--z-raised);
}
</style>
