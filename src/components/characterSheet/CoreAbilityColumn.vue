<template>
  <div class="core-ability-column">
    <!-- Core Ability Header -->
    <CoreAbilityHeader :title="columnConfig.title" :value="coreAbilityValue"
      @update="updateNestedProperty(columnConfig.coreAbilityKey, $event)" />

    <!-- Skills -->
    <SkillRow v-for="skill in skills" :key="skill.name" :skill="skill" :is-rank-active="isRankActive"
      :is-dice-added="isDiceAdded" :is-dice-subtracted="isDiceSubtracted"
      :get-style-class-for-favored-status="getStyleClassForFavoredStatus"
      @open-skill-check="$emit('open-skill-check', $event)" @dice-click="handleDiceClick" />

    <!-- Virtue Row -->
    <StatRow type="range" :label="columnConfig.virtueLabel" :value="virtueValue"
      @update="(field, value) => updateNestedProperty(`${columnConfig.virtueKey}.${field}`, value)" />

    <!-- Weakness Row -->
    <StatRow type="single" :label="columnConfig.weaknessLabel" :value="weaknessValue"
      @update="updateNestedProperty(columnConfig.weaknessKey, $event)" />

    <!-- State Row -->
    <StatRow type="state" :label="capitalizeFirstLetter(columnConfig.firstStateKey)" :first-state="firstStateValue"
      :second-state="secondStateValue" @update="(field, value) => {
        const stateKey = field === 'first' ? columnConfig.firstStateKey : columnConfig.secondStateKey
        updateNestedProperty(`states.${stateKey}`, value)
      }" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { capitalizeFirstLetter } from '../../../utils/stringUtils'
import { useColumnConfig } from '@/composables/useColumnConfig'
import { useSkillDice } from '@/composables/useSkillDice'
import { useNestedPropertyUpdate } from '@/composables/useNestedPropertyUpdate'
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
})

// Emits
const emit = defineEmits(['update-character', 'open-skill-check'])

// Composables
const updateCharacter = (updatedCharacter) => {
  emit('update-character', updatedCharacter)
}

const {
  config: columnConfig,
  coreAbilityValue,
  virtueValue,
  weaknessValue,
  firstStateValue,
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
</script>

<style scoped>
.core-ability-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  background-color: black;
  border-radius: 5px;
  padding: 15px;
  width: 270px;
  max-width: 270px;
}
</style>
