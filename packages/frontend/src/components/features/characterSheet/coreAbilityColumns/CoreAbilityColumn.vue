<template>
  <CharacterSheetSection custom-class="core-ability-column" min-width="270px" max-width="285px">
    <CoreAbilityHeader :title="coreAbilityTitle" :value="coreAbilityValue" :can-edit="canEdit"
      @update="updateCoreAbility" />

    <SkillRow v-for="skill in skills" :key="getSkillId(skill)" :skill="skill" :can-edit="canEdit"
      @open-skill-check="openSkillCheckModal" @update-ranks="handleRanksUpdate"
      @update-manual-dice-mod="handleManualDiceModUpdate" @update-favored-status="handleFavoredStatusUpdate" />

    <StatRow :type="STAT_ROW_TYPES.RANGE" :label="virtueLabel" :value="virtueValue" :can-edit="canEdit"
      :armor-defense-bonus="virtueKey === 'defense' ? armorDefenseBonus : 0" :show-auto-calc-button="true"
      :is-auto-calc="isMaxVirtueAuto" @update="updateVirtue" @reset="resetVirtue"
      @toggle-auto-calc="handleToggleVirtueAutoCalc" />

    <StatRow :type="STAT_ROW_TYPES.SINGLE" :label="weaknessLabel" :value="weaknessValue" :can-edit="canEdit"
      :show-auto-calc-button="showLoadAutoCalcButton" :show-injury-roll-button="showInjuryRollButton"
      :is-auto-calc="isLoadAuto" @update="updateWeakness" @toggle-auto-calc="handleToggleLoadAutoCalc"
      @roll-injury="handleInjuryRoll" />

    <StatRow :type="STAT_ROW_TYPES.STATE" :label="firstStateLabel" :first-state="firstStateValue"
      :second-state="secondStateValue" :can-edit="canEdit" :show-auto-calc-button="showStatesAutoCalcButton"
      :is-auto-calc="isStatesAuto" @update="updateState" @toggle-auto-calc="handleToggleStatesAutoCalc" />

    <SkillCheckModal v-if="skillCheckModalOpen && character" :character="character" :selectedSkillKey="selectedSkillKey"
      :defaultDifficulty="rollsStore.lastDifficulty" @close="skillCheckModalOpen = false"
      @update-difficulty="rollsStore.setLastDifficulty" @start-contest="handleStartContest" />

    <ContestModal v-if="contestModalOpen && character" :character="character"
      :initial-session-config="contestSessionConfig" @close="contestModalOpen = false" />
  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useColumnConfig } from '@/composables/useColumnConfig'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { STAT_ROW_TYPES } from '@/constants/statRowTypes'
import { ARMOR_TYPE_ID } from '@/constants/armorConstants'
import * as CharacterUtils from '@shared/utils/characterUtils'
import InjuryRollService from '@/services/rolls/injuryRollService'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import CoreAbilityHeader from './CoreAbilityHeader.vue'
import SkillRow from './SkillRow.vue'
import StatRow from './StatRow.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import ContestModal from '@/components/features/characterSheet/rollModal/ContestModal.vue'
import { findSkillById, getSkillId } from '@/utils/characterKeyUtils'

const props = defineProps({
  column: {
    type: Object,
    required: true,
  }
})

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const conceptsStore = useConceptsStore()

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
  character.value[virtueKey.value].current = character.value[virtueKey.value].base
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
const isStatesAuto = computed(() => character.value?.autoCalculations?.states ?? true)
const showLoadAutoCalcButton = computed(() => weaknessKey.value === 'load')
const showInjuryRollButton = computed(() => weaknessKey.value === 'injury')
const showStatesAutoCalcButton = computed(() => true) // Always show for states

// Virtue base auto-calc flag (Endurance/Hope/Defense)
const isMaxVirtueAuto = computed(() => {
  const key = virtueKey.value
  if (key === 'endurance') return character.value?.autoCalculations?.baseEndurance ?? true
  if (key === 'hope') return character.value?.autoCalculations?.baseHope ?? true
  if (key === 'defense') return character.value?.autoCalculations?.baseDefense ?? true
  return true
})

// Armor defense bonus — sum of defenseBonus for all worn armor items, halved (floor) for untrained items
const armorTrainedGrades = computed(() => {
  if (!character.value?.mestiereId) return []
  const mestiere = conceptsStore.mestieri.find(m => m.id === character.value.mestiereId)
  return mestiere?.novizio?.martialTraining?.armorGrades ?? []
})

const armorDefenseBonus = computed(() => {
  if (!character.value?.equipment || !allEquipment.value) return 0

  const trainedGrades = armorTrainedGrades.value
  const isBeast = character.value.characterType === "beast"

  return character.value.equipment
    .filter(entry => entry.isWielding)
    .reduce((sum, entry) => {
      const eq = allEquipment.value.find(e => e.id === entry.id)

      if (eq?.type === ARMOR_TYPE_ID && eq.defenseBonus > 0) {
        const bonus = isBeast
          ? eq.defenseBonus
          : trainedGrades.includes(eq.grade)
            ? eq.defenseBonus
            : Math.floor(eq.defenseBonus / 2)

        return sum + bonus
      }

      return sum
    }, 0)
})

// When armor bonus or wits changes, keep defense.base up to date (defense column only)
watch([() => character.value?.wits, armorDefenseBonus], () => {
  if (!character.value || virtueKey.value !== 'defense') return
  if (!(character.value?.autoCalculations?.baseDefense ?? true)) return
  character.value.defense.base = CharacterUtils.calculatebaseDefense(character.value.wits) + armorDefenseBonus.value
})

const handleToggleVirtueAutoCalc = () => {
  if (!character.value) return
  if (!character.value.autoCalculations) {
    character.value.autoCalculations = { load: true, states: true, baseEndurance: true, baseHope: true, baseDefense: true }
  }
  const key = virtueKey.value
  if (key === 'endurance') {
    character.value.autoCalculations.baseEndurance = !(character.value.autoCalculations.baseEndurance ?? true)
    if (character.value.autoCalculations.baseEndurance) {
      character.value.endurance.base = CharacterUtils.calculatebaseEndurance(character.value.body)
    }
  } else if (key === 'hope') {
    character.value.autoCalculations.baseHope = !(character.value.autoCalculations.baseHope ?? true)
    if (character.value.autoCalculations.baseHope) {
      character.value.hope.base = CharacterUtils.calculatebaseHope(character.value.heart)
    }
  } else if (key === 'defense') {
    character.value.autoCalculations.baseDefense = !(character.value.autoCalculations.baseDefense ?? true)
    if (character.value.autoCalculations.baseDefense) {
      character.value.defense.base = CharacterUtils.calculatebaseDefense(character.value.wits) + armorDefenseBonus.value
    }
  }
}

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
    character.value.autoCalculations = { load: true, states: true }
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
    character.value.autoCalculations = { load: true, states: true }
  }
  character.value.autoCalculations.states = !character.value.autoCalculations.states
  // If turning on auto, calculate immediately
  if (character.value.autoCalculations.states) {
    handleCalculateStates()
  }
}

const updateState = (field, value) => {
  const stateKey = field === 'first' ? firstStateKey.value : secondStateKey.value
  character.value.states[stateKey] = value
}

const handleRanksUpdate = (skillKey, newRanks) => {
  const skill = findSkillById(character.value.skills, skillKey)
  if (!skill) return
  skill.ranks = newRanks
  CharacterUtils.updateFavoredStatus(character.value)
}

const handleManualDiceModUpdate = (skillKey, newManualDiceMod) => {
  const skill = findSkillById(character.value.skills, skillKey)
  if (!skill) return
  skill.manualDiceMod = newManualDiceMod
  CharacterUtils.updateFavoredStatus(character.value)
}

const handleFavoredStatusUpdate = (skillKey, { isFavored, isIllFavored }) => {
  const skill = findSkillById(character.value.skills, skillKey)
  if (!skill) return
  skill.isFavored = isFavored
  skill.isIllFavored = isIllFavored
}

const skillCheckModalOpen = ref(false)
const contestModalOpen = ref(false)
const selectedSkillKey = ref('')
const contestSessionConfig = ref(null)

const openSkillCheckModal = (skillKey) => {
  selectedSkillKey.value = skillKey
  skillCheckModalOpen.value = true
}

const handleStartContest = (config) => {
  skillCheckModalOpen.value = false
  contestSessionConfig.value = config
  contestModalOpen.value = true
}
</script>

<style scoped>
.core-ability-column {
  align-items: center;
}
</style>
