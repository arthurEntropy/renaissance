<template>
  <CharacterSheetSection custom-class="core-ability-column" min-width="270px" max-width="285px">
    <CoreAbilityHeader :title="coreAbilityTitle" :value="coreAbilityValue" :can-edit="canEdit"
      @update="updateCoreAbility" />

    <SkillRow v-for="skill in skills" :key="skill.name" :skill="skill" :can-edit="canEdit"
      @open-skill-check="openSkillCheckModal" @update-ranks="handleRanksUpdate"
      @update-manual-dice-mod="handleManualDiceModUpdate" />

    <StatRow :type="STAT_ROW_TYPES.RANGE" :label="virtueLabel" :value="virtueValue" :can-edit="canEdit"
      @update="updateVirtue" @reset="resetVirtue" />

    <StatRow :type="STAT_ROW_TYPES.SINGLE" :label="weaknessLabel" :value="weaknessValue" :can-edit="canEdit"
      :show-auto-calc-button="showLoadAutoCalcButton" :show-injury-roll-button="showInjuryRollButton"
      :is-auto-calc="isLoadAuto" @update="updateWeakness" @calculate="handleCalculateLoad"
      @toggle-auto-calc="handleToggleLoadAutoCalc" @roll-injury="handleInjuryRoll" />

    <StatRow :type="STAT_ROW_TYPES.STATE" :label="firstStateLabel" :first-state="firstStateValue"
      :second-state="secondStateValue" :can-edit="canEdit" :show-auto-calc-button="showStatesAutoCalcButton"
      :is-auto-calc="isStatesAuto" @update="updateState" @calculate="handleCalculateStates"
      @toggle-auto-calc="handleToggleStatesAutoCalc" />

    <SkillCheckModal v-if="skillCheckModal.isOpen.value && character" :character="character"
      :selectedSkillName="selectedSkillName" :defaultTargetNumber="rollsStore.lastTargetNumber"
      @close="skillCheckModal.closeModal" @update-target-number="rollsStore.setLastTargetNumber"
      @start-opposed-skill-check="handleStartOpposedSkillCheck" />

    <OpposedSkillCheckModal v-if="opposedSkillCheckModal.isOpen.value && character" :character="character"
      :initial-session-config="opposedSessionConfig" @close="opposedSkillCheckModal.closeModal" />
  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useModal } from '@/composables/useModal'
import { useColumnConfig } from '@/composables/useColumnConfig'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { STAT_ROW_TYPES } from '@shared/constants/characterConstants'
import * as CharacterUtils from '@shared/types/entities/characterUtils'
import InjuryRollService from '@/services/rolls/injuryRollService'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import CoreAbilityHeader from './CoreAbilityHeader.vue'
import SkillRow from './SkillRow.vue'
import StatRow from './StatRow.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import OpposedSkillCheckModal from '@/components/features/characterSheet/rollModal/OpposedSkillCheckModal.vue'

const props = defineProps({
  column: {
    type: String,
    required: true,
  }
})

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)
const allEquipment = computed(() => equipmentStore.equipment || [])

const {
  coreAbilityKey,
  coreAbilityValue,
  coreAbilityTitle,
  virtueLabel,
  virtueKey,
  virtueValue,
  weaknessLabel,
  weaknessKey,
  weaknessValue,
  firstStateKey,
  firstStateLabel,
  firstStateValue,
  secondStateKey,
  secondStateValue,
  skills
} = useColumnConfig(computed(() => props.column), character)

const updateCoreAbility = (newValue) => {
  character.value[coreAbilityKey.value] = newValue
}

const updateVirtue = (field, value) => {
  character.value[virtueKey.value][field] = value
}

const resetVirtue = () => {
  character.value[virtueKey.value].current = character.value[virtueKey.value].max
}

const updateWeakness = (value) => {
  character.value[weaknessKey.value] = value
}

const handleInjuryRoll = () => {
  if (!character.value) return
  const rollResult = InjuryRollService.makeInjuryRoll(character.value)
  rollsStore.setRoll(rollResult)
}

// Auto-calculation computed properties
const isLoadAuto = computed(() => character.value?.autoCalculations?.load ?? true)
const isStatesAuto = computed(() => character.value?.autoCalculations?.statesAndEffects ?? true)
const showLoadAutoCalcButton = computed(() => weaknessKey.value === 'load')
const showInjuryRollButton = computed(() => weaknessKey.value === 'injury')
const showStatesAutoCalcButton = computed(() => true) // Always show for states

// Auto-calculation handlers
const handleCalculateLoad = () => {
  if (!character.value) return
  character.value.load = CharacterUtils.calculateLoad(character.value, allEquipment.value)
}

const handleCalculateStates = () => {
  if (!character.value) return
  CharacterUtils.updateAllStates(character.value)
  CharacterUtils.updateDiceMods(character.value)
  CharacterUtils.updateFavoredStatus(character.value)
}

const handleToggleLoadAutoCalc = () => {
  if (!character.value) return
  if (!character.value.autoCalculations) {
    character.value.autoCalculations = { load: true, statesAndEffects: true }
  }
  character.value.autoCalculations.load = !character.value.autoCalculations.load
  // If turning on auto, calculate immediately
  if (character.value.autoCalculations.load) {
    handleCalculateLoad()
  }
}

const handleToggleStatesAutoCalc = () => {
  if (!character.value) return
  if (!character.value.autoCalculations) {
    character.value.autoCalculations = { load: true, statesAndEffects: true }
  }
  character.value.autoCalculations.statesAndEffects = !character.value.autoCalculations.statesAndEffects
  // If turning on auto, calculate immediately
  if (character.value.autoCalculations.statesAndEffects) {
    handleCalculateStates()
  }
}

const updateState = (field, value) => {
  const stateKey = field === 'first' ? firstStateKey.value : secondStateKey.value
  character.value.states[stateKey] = value
}

const handleRanksUpdate = (skillName, newRanks) => {
  const skill = character.value.skills.find(s => s.name === skillName)
  skill.ranks = newRanks
  CharacterUtils.updateFavoredStatus(character.value)
}

const handleManualDiceModUpdate = (skillName, newManualDiceMod) => {
  const skill = character.value.skills.find(s => s.name === skillName)
  skill.manualDiceMod = newManualDiceMod
  CharacterUtils.updateFavoredStatus(character.value)
}

const skillCheckModal = useModal()
const opposedSkillCheckModal = useModal()
const selectedSkillName = ref('')
const opposedSessionConfig = ref(null)

const openSkillCheckModal = (skillName) => {
  selectedSkillName.value = skillName
  skillCheckModal.openModal()
}

const handleStartOpposedSkillCheck = (config) => {
  skillCheckModal.closeModal()
  opposedSessionConfig.value = config
  opposedSkillCheckModal.openModal()
}
</script>

<style scoped>
.core-ability-column {
  align-items: center;
}
</style>
