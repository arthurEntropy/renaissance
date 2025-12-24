import { computed } from 'vue'
import { VIRTUES, WEAKNESSES, STATES } from '@shared/constants/characterConstants'

// Derives all column metadata and values for a core ability (Body, Heart, or Wits).
// Maps constants to character data, providing virtue/weakness labels and values,
// state labels and values, and filtered skills list.
export function useColumnConfig(coreAbility, character) {
  const virtueConfig = computed(() => 
    Object.values(VIRTUES).find(v => v.coreAbility === coreAbility.value)
  )
  
  const weaknessConfig = computed(() => 
    Object.values(WEAKNESSES).find(w => w.coreAbility === coreAbility.value)
  )
  
  const stateConfigs = computed(() => 
    Object.values(STATES).filter(s => s.coreAbility === coreAbility.value)
  )

  const coreAbilityValue = computed(() => {
    return character.value?.[coreAbility.value] ?? 0
  })

  const virtueValue = computed(() => {
    if (!virtueConfig.value || !character.value) return { current: 0, max: 0 }
    return character.value[virtueConfig.value.key] || { current: 0, max: 0 }
  })

  const weaknessValue = computed(() => {
    return weaknessConfig.value ? character.value?.[weaknessConfig.value.key] ?? 0 : 0
  })

  const firstStateValue = computed(() => {
    const stateConfig = stateConfigs.value[0]
    return stateConfig ? character.value?.states?.[stateConfig.key] ?? false : false
  })

  const secondStateValue = computed(() => {
    const stateConfig = stateConfigs.value[1]
    return stateConfig ? character.value?.states?.[stateConfig.key] ?? false : false
  })

  const skills = computed(() => {
    return character.value?.skills?.filter(
      skill => skill.coreAbility === coreAbility.value
    ) ?? []
  })

  return {
    coreAbilityKey: computed(() => coreAbility.value),
    coreAbilityValue,
    coreAbilityTitle: computed(() => coreAbility.value.toUpperCase()),
    
    virtueLabel: computed(() => virtueConfig.value?.label || ''),
    virtueKey: computed(() => virtueConfig.value?.key || ''),
    virtueValue,
    
    weaknessLabel: computed(() => weaknessConfig.value?.label || ''),
    weaknessKey: computed(() => weaknessConfig.value?.key || ''),
    weaknessValue,
    
    firstStateKey: computed(() => stateConfigs.value[0]?.key || ''),
    firstStateLabel: computed(() => stateConfigs.value[0]?.label || ''),
    firstStateValue,
    secondStateKey: computed(() => stateConfigs.value[1]?.key || ''),
    secondStateLabel: computed(() => stateConfigs.value[1]?.label || ''),
    secondStateValue,
    
    skills
  }
}
