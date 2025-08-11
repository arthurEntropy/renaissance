import { computed } from 'vue'
import { CORE_ABILITY_COLUMNS } from '@/constants/coreAbilityConfig'

export function useColumnConfig(column, character) {
  const config = computed(() => CORE_ABILITY_COLUMNS[column.value])

  const coreAbilityValue = computed(() => {
    return character.value[config.value.coreAbilityKey]
  })

  const virtueValue = computed(() => {
    return character.value[config.value.virtueKey]
  })

  const weaknessValue = computed(() => {
    return character.value[config.value.weaknessKey]
  })

  const firstStateValue = computed(() => {
    return character.value.states[config.value.firstStateKey]
  })

  const secondStateValue = computed(() => {
    return character.value.states[config.value.secondStateKey]
  })

  const skills = computed(() => {
    const [start, end] = config.value.skillRange
    return character.value.skills.slice(start, end)
  })

  return {
    config,
    coreAbilityValue,
    virtueValue,
    weaknessValue,
    firstStateValue,
    secondStateValue,
    skills
  }
}
