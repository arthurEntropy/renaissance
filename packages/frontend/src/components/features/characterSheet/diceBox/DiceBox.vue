<template>
  <CharacterSheetSection custom-class="dice-box edit-hover-area" :min-width="'300px'">

    <div v-if="canEdit" class="dice-box-controls">
      <FloatingActionButton v-if="!customDiceRollerOpen" :variant="FAB_TYPES.INITIATIVE" :size="FAB_SIZES.LARGE"
        :visibility="FAB_VISIBILITIES.ON_HOVER" @click="handleInitiativeRoll" />

      <FloatingActionButton v-if="!customDiceRollerOpen" :variant="FAB_TYPES.INJURY" :size="FAB_SIZES.LARGE"
        :visibility="FAB_VISIBILITIES.ON_HOVER" @click="handleInjuryRoll" />

      <FloatingActionButton :variant="customDiceRollerOpen ? FAB_TYPES.DELETE : FAB_TYPES.DICE" :size="FAB_SIZES.LARGE"
        :visibility="FAB_VISIBILITIES.ON_HOVER" @click="toggleCustomDiceRoller" />
    </div>

    <!-- Custom Dice Roller View -->
    <div v-show="customDiceRollerOpen" class="custom-roller-view view-container">
      <CustomDiceRoller :character="activeCharacter" @roll-complete="handleRollComplete" />
    </div>

    <!-- Roll Results Display -->
    <div v-show="!customDiceRollerOpen && latestRoll" class="roll-content view-container">
      <template v-if="latestRoll">
        <RollTitle :rollData="latestRoll" :isEngagement="isEngagement" :isOpposedSkillCheck="isOpposedSkillCheck"
          :isCustomRoll="isCustomRoll" :isDamage="isDamage" :isInitiative="isInitiative" :isInjury="isInjury" />

        <DiceDisplay ref="diceDisplayRef" :key="latestRoll?.timestamp" :rollData="latestRoll"
          :isEngagement="isEngagement" :canReroll="true" :isOpponent="false" :containerWidth="CONTAINER_WIDTH"
          :skip-animation="shouldSkipRollAnimation" @reroll-all-dice="rollsStore.reroll" />

        <RollOutcome :rollData="latestRoll" :isEngagement="isEngagement" :isOpposedSkillCheck="isOpposedSkillCheck"
          :isCustomRoll="isCustomRoll" :isDamage="isDamage" :isInitiative="isInitiative" :isInjury="isInjury"
          :isRolling="isRolling" />
      </template>
    </div>

    <!-- Take XP Button -->
    <ActionButton v-if="canEdit && xpEarned > 0 && !hasClaimedXp && !isRolling && !customDiceRollerOpen"
      class="take-xp-button" variant="primary" size="small" :text="`← Take ${xpEarned} XP`" @click="handleTakeXp" />

    <!-- Empty State -->
    <div v-show="!customDiceRollerOpen && !latestRoll" class="empty-state-container view-container">
      <EmptyRollState />
    </div>

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { RollTypes } from '@/constants/rollTypes'
import { computeXpEarned } from '@/services/rolls/rollStatsService'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import DiceDisplay from './DiceDisplay.vue'
import RollTitle from './RollTitle.vue'
import RollOutcome from './RollOutcome.vue'
import EmptyRollState from './EmptyRollState.vue'
import CustomDiceRoller from '../customDiceRoller/CustomDiceRoller.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'
import InitiativeRollService from '@/services/rolls/initiativeRollService'
import InjuryRollService from '@/services/rolls/injuryRollService'

const props = defineProps({
  character: { type: Object, default: null },
})

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()

const diceDisplayRef = ref(null)

const CONTAINER_WIDTH = 310

const customDiceRollerOpen = ref(false)

// Get the active character - use explicit prop if provided, otherwise fall back to selected
const activeCharacter = computed(() => props.character || charactersStore.selectedCharacter)

const toggleCustomDiceRoller = () => {
  customDiceRollerOpen.value = !customDiceRollerOpen.value
}

const handleRollComplete = () => {
  customDiceRollerOpen.value = false
}

const handleInitiativeRoll = () => {
  const character = activeCharacter.value
  if (!character) return

  const rollResult = InitiativeRollService.makeInitiativeRoll(character)
  rollsStore.setRoll(rollResult)
}

const handleInjuryRoll = () => {
  const character = activeCharacter.value
  if (!character) return

  const rollResult = InjuryRollService.makeInjuryRoll(character)
  rollsStore.setRoll(rollResult)
}

const canEdit = computed(() => {
  if (!activeCharacter.value) return false
  return charactersStore.canEditSelectedCharacter && activeCharacter.value.id === charactersStore.selectedCharacter?.id
})
const latestRoll = computed(() => {
  const characterId = activeCharacter.value?.id
  if (!characterId || !rollsStore.latestRoll) {
    return null
  }

  return rollsStore.latestRoll.rollCharacterId === characterId
    ? rollsStore.latestRoll
    : null
})

const currentRollDisplayKey = computed(() => {
  if (!latestRoll.value?.timestamp || !latestRoll.value?.rollCharacterId) {
    return null
  }

  return `${latestRoll.value.rollCharacterId}_${latestRoll.value.timestamp}`
})

const shouldSkipRollAnimation = computed(() => {
  return !!currentRollDisplayKey.value && rollsStore.hasDisplayedRollKey(currentRollDisplayKey.value)
})

watch(currentRollDisplayKey, (newKey, oldKey) => {
  if (!newKey || newKey === oldKey || rollsStore.hasDisplayedRollKey(newKey)) {
    return
  }

  nextTick(() => {
    rollsStore.markRollKeyDisplayed(newKey)
  })
})

const isEngagement = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.ENGAGEMENT
})

const isOpposedSkillCheck = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.OPPOSED_SKILL_CHECK
})

const isCustomRoll = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.CUSTOM_ROLL
})

const isDamage = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.DAMAGE
})

const isInitiative = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.INITIATIVE
})

const isInjury = computed(() => {
  return latestRoll.value && latestRoll.value.type === RollTypes.INJURY
})

const isRolling = computed(() => {
  return diceDisplayRef.value?.isRolling || false
})

const xpEarned = computed(() => latestRoll.value ? computeXpEarned(latestRoll.value) : 0)

const claimedXpKeys = ref([])

const hasClaimedXp = computed(() =>
  !currentRollDisplayKey.value || claimedXpKeys.value.includes(currentRollDisplayKey.value)
)

const handleTakeXp = () => {
  const character = activeCharacter.value
  if (!character || !currentRollDisplayKey.value) return
  character.xp = (character.xp || 0) + xpEarned.value
  claimedXpKeys.value.push(currentRollDisplayKey.value)
}
</script>

<style scoped>
.dice-box {
  position: relative;
  justify-content: flex-start;
  align-items: flex-start;
  padding-top: 40px;
  width: auto;
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

.dice-box-controls {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  display: flex;
  gap: var(--space-xs);
  z-index: var(--z-raised);
}

.action-btn.take-xp-button {
  --action-btn-bg: var(--color-accent-cyan);
  --action-btn-bg-hover: var(--color-accent-cyan);
  --action-btn-bg-active: var(--color-accent-cyan);
  --action-btn-text: var(--color-black);
  --action-btn-text-hover: var(--color-black);
  --action-btn-text-active: var(--color-black);
  --action-btn-border-color: var(--color-accent-cyan);
  --action-btn-border-color-hover: var(--color-accent-cyan);
  --action-btn-border-color-active: var(--color-accent-cyan);

  padding: 7px;
  font-size: var(--font-size-12);
  font-weight: bold;
  position: absolute;
  bottom: 0px;
  left: 0px;
  border-radius: 0 var(--radius-15) 0 0;
  z-index: var(--z-raised);
  background-color: var(--color-accent-cyan);
  border-color: var(--color-accent-cyan);
  color: var(--color-black);
  animation: pulse-glow-cyan 1.5s ease-in-out infinite;
}

.action-btn.take-xp-button:hover:not(.action-btn--disabled) {
  background-color: var(--color-accent-cyan);
  color: var(--color-black);
  border-color: var(--color-accent-cyan);
  box-shadow: inset 0 0 0 999px var(--overlay-black-subtle), 0 0 5px var(--color-accent-cyan);
}

@keyframes pulse-glow-cyan {

  0%,
  100% {
    box-shadow: 0 0 5px var(--color-accent-cyan);
  }

  50% {
    box-shadow: 0 0 15px var(--color-accent-cyan);
  }
}
</style>
