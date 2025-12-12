<template>
  <CharacterSheetSection custom-class="core-ability-column" min-width="270px" max-width="320px">
    <!-- Core Ability Header -->
    <CoreAbilityHeader :title="coreAbilityTitle" :value="coreAbilityValue" :is-edit-mode="isEditMode"
      @update="character[coreAbilityKey.value] = $event" />

    <!-- Skills -->
    <SkillRow v-for="skill in skills" :key="skill.name" :skill="skill" :is-edit-mode="isEditMode"
      @open-skill-check="$emit('open-skill-check', $event)" @dice-click="handleDiceClick" />

    <!-- Virtue Row -->
    <StatRow type="range" :label="virtueLabel" :value="virtueValue" :is-edit-mode="isEditMode"
      @update="(field, value) => character[virtueKey.value][field] = value" />

    <!-- Weakness Row -->
    <StatRow type="single" :label="weaknessLabel" :value="weaknessValue" :is-edit-mode="isEditMode"
      @update="(value) => character[weaknessKey.value] = value" />

    <!-- State Row -->
    <StatRow type="state" :label="firstStateLabel" :first-state="firstStateValue" :second-state="secondStateValue"
      :is-edit-mode="isEditMode" @update="(field, value) => {
        const stateKey = field === 'first' ? firstStateKey.value : secondStateKey.value
        character.states[stateKey] = value
      }" />
  </CharacterSheetSection>
</template>

<script setup>
import { computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useColumnConfig } from '@/composables/useColumnConfig'
import * as CharacterUtils from '@shared/types/entities/characterUtils'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import CoreAbilityHeader from './CoreAbilityHeader.vue'
import SkillRow from './SkillRow.vue'
import StatRow from './StatRow.vue'

const props = defineProps({
  character: {
    type: Object,
    required: true
  },
  column: {
    type: String,
    required: true,
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-skill-check'])

// Wrap character in computed for reactivity
const character = computed(() => props.character)

const updateCharacter = (updatedCharacter) => {
  Object.assign(props.character, updatedCharacter)
}

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
  secondStateLabel: _secondStateLabel,
  secondStateValue,
  skills
} = useColumnConfig(computed(() => props.column), character)

// Handle dice click for skill rank updates
const handleDiceClick = (skillName, diceIndex) => {
  const updatedCharacter = {
    ...character.value,
    skills: character.value.skills.map(skill => {
      if (skill.name === skillName) {
        const newRank = diceIndex + 1
        const updatedRanks = newRank === skill.ranks ? skill.ranks - 1 : newRank
        return { ...skill, ranks: updatedRanks }
      }
      return skill
    })
  }

  CharacterUtils.updateFavoredStatus(updatedCharacter)
  updateCharacter(updatedCharacter)
}
</script>

<style scoped>
.core-ability-column {
  align-items: center;
  width: 270px;
  max-width: 270px;
  flex: 1;
}
</style>
