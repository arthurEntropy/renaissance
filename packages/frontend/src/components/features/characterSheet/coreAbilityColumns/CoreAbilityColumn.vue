<template>
  <CharacterSheetSection custom-class="core-ability-column" min-width="270px" max-width="320px">
    <!-- Core Ability Header -->
    <CoreAbilityHeader :title="coreAbilityTitle" :value="coreAbilityValue" :is-edit-mode="isEditMode"
      @update="updateNestedProperty(coreAbilityKey, $event)" />

    <!-- Skills -->
    <SkillRow v-for="skill in skills" :key="skill.name" :skill="skill" :is-edit-mode="isEditMode"
      :is-rank-active="isRankActive" :is-dice-added="isDiceAdded" :is-dice-subtracted="isDiceSubtracted"
      :get-style-class-for-favored-status="getStyleClassForFavoredStatus"
      @open-skill-check="$emit('open-skill-check', $event)" @dice-click="handleDiceClick" />

    <!-- Virtue Row -->
    <StatRow type="range" :label="virtueLabel" :value="virtueValue" :is-edit-mode="isEditMode"
      @update="(field, value) => updateVirtueWeakness(`${virtueKey}.${field}`, value)" />

    <!-- Weakness Row -->
    <StatRow type="single" :label="weaknessLabel" :value="weaknessValue" :is-edit-mode="isEditMode"
      @update="(value) => updateVirtueWeakness(weaknessKey, value)" />

    <!-- State Row -->
    <StatRow type="state" :label="firstStateLabel" :first-state="firstStateValue" :second-state="secondStateValue"
      :is-edit-mode="isEditMode" @update="(field, value) => {
        const stateKey = field === 'first' ? firstStateKey : secondStateKey
        updateNestedProperty(`states.${stateKey}`, value)
      }" />
  </CharacterSheetSection>
</template>

<script setup>
import { computed } from 'vue'
import { useColumnConfig } from '@/composables/useColumnConfig'
import { useSkillDice } from '@/composables/useSkillDice'
import { useNestedPropertyUpdate } from '@/composables/useNestedPropertyUpdate'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import CoreAbilityHeader from './CoreAbilityHeader.vue'
import SkillRow from './SkillRow.vue'
import StatRow from './StatRow.vue'

// Props
const props = defineProps({
  character: {
    type: Object,
    required: true,
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

// Emits
const emit = defineEmits(['update-character', 'open-skill-check'])

// Composables
const updateCharacter = (updatedCharacter) => {
  emit('update-character', updatedCharacter)
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
} = useColumnConfig(computed(() => props.column), computed(() => props.character))

const {
  isRankActive,
  isDiceAdded,
  isDiceSubtracted,
  getStyleClassForFavoredStatus,
  handleDiceClick
} = useSkillDice(computed(() => props.character), updateCharacter)

const { updateNestedProperty } = useNestedPropertyUpdate(
  computed(() => props.character),
  updateCharacter
)

// Custom handler for virtue/weakness updates
const updateVirtueWeakness = (key, value) => {
  updateNestedProperty(key, value)
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
