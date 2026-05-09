import { computed } from 'vue'
import {
  SKILLS,
  STATES,
  VIRTUES,
  WEAKNESSES,
} from '@shared/constants/characterConstants'

// Derives all column metadata and values for a core ability (Body, Heart, or Wits).
// Maps constants to character data, providing virtue/weakness labels and values,
// state labels and values, and filtered skills list.
/**
 * @param {{ value: { key: string, label: string } }} coreAbility
 * @param {{ value: ({ skills?: Array<{ key: string }>, states?: Record<string, boolean> } & Record<string, any>) | null }} character
 */
export function useColumnConfig(coreAbility, character) {
  const coreAbilityKey = computed(() => coreAbility.value?.key || '')

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
    return character.value?.[coreAbilityKey.value] ?? 0
  })

  const virtueValue = computed(() => {
    if (!virtueConfig.value || !character.value) return { current: 0, base: 0 }
    return character.value[virtueConfig.value.key] || { current: 0, base: 0 }
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

  const skillKeysByCoreAbility = computed(() => {
    const abilityKey = coreAbilityKey.value
    if (!abilityKey) return new Set()

    return new Set(
      Object.values(SKILLS)
        .filter((skillDef) => skillDef.coreAbility.key === abilityKey)
        .map((skillDef) => skillDef.key)
    )
  })

  const skills = computed(() => {
    const allowedSkillKeys = skillKeysByCoreAbility.value
    return character.value?.skills?.filter(
      (skill) => allowedSkillKeys.has(skill.key)
    ) ?? []
  })

  return {
    coreAbilityKey,
    coreAbilityValue,
    coreAbilityTitle: computed(() => coreAbility.value.label),
    
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
