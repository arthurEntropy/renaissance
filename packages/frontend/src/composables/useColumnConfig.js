import { computed } from 'vue'
import { VIRTUES, WEAKNESSES, STATES } from '@shared/constants/characterConstants'

/**
 * Composable for managing core ability column data.
 * Derives all metadata (virtues, weaknesses, states, skills) based on coreAbility.
 * 
 * @param {ComputedRef<string>} coreAbility - The core ability key ('body', 'heart', or 'wits')
 * @param {ComputedRef<Object>} character - The character object
 */
export function useColumnConfig(coreAbility, character) {
  // Derive metadata from centralized constants
  const virtueConfig = computed(() => 
    Object.values(VIRTUES).find(v => v.coreAbility === coreAbility.value)
  )
  
  const weaknessConfig = computed(() => 
    Object.values(WEAKNESSES).find(w => w.coreAbility === coreAbility.value)
  )
  
  const stateConfigs = computed(() => 
    Object.values(STATES).filter(s => s.coreAbility === coreAbility.value)
  )

  // Core ability value
  const coreAbilityValue = computed(() => {
    return character.value?.[coreAbility.value] ?? 0
  })

  // Virtue (StatPool with coreAbility field)
  const virtueValue = computed(() => {
    if (!virtueConfig.value || !character.value) return { current: 0, max: 0 }
    return character.value[virtueConfig.value.key] || { current: 0, max: 0 }
  })

  // Weakness (plain number)
  const weaknessValue = computed(() => {
    return weaknessConfig.value ? character.value?.[weaknessConfig.value.key] ?? 0 : 0
  })

  // States (booleans in states object)
  const firstStateValue = computed(() => {
    const stateConfig = stateConfigs.value[0]
    return stateConfig ? character.value?.states?.[stateConfig.key] ?? false : false
  })

  const secondStateValue = computed(() => {
    const stateConfig = stateConfigs.value[1]
    return stateConfig ? character.value?.states?.[stateConfig.key] ?? false : false
  })

  // Skills filtered by coreAbility
  const skills = computed(() => {
    return character.value?.skills?.filter(
      skill => skill.coreAbility === coreAbility.value
    ) ?? []
  })

  return {
    // Core ability
    coreAbilityKey: computed(() => coreAbility.value),
    coreAbilityValue,
    coreAbilityTitle: computed(() => coreAbility.value.toUpperCase()),
    
    // Virtue
    virtueLabel: computed(() => virtueConfig.value?.label || ''),
    virtueKey: computed(() => virtueConfig.value?.key || ''),
    virtueValue,
    
    // Weakness
    weaknessLabel: computed(() => weaknessConfig.value?.label || ''),
    weaknessKey: computed(() => weaknessConfig.value?.key || ''),
    weaknessValue,
    
    // States
    firstStateKey: computed(() => stateConfigs.value[0]?.key || ''),
    firstStateLabel: computed(() => stateConfigs.value[0]?.label || ''),
    firstStateValue,
    secondStateKey: computed(() => stateConfigs.value[1]?.key || ''),
    secondStateLabel: computed(() => stateConfigs.value[1]?.label || ''),
    secondStateValue,
    
    // Skills
    skills
  }
}
