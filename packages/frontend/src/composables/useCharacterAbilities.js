import { computed } from 'vue'

// Merges character ability references with full ability definitions.
// Character data stores minimal references: {id, collapsed, showImprovements, improvements}
// This composable joins them with full ability definitions from the master abilities list,
// avoiding data duplication while maintaining character-specific UI state and improvement ownership.
export function useCharacterAbilities(characterAbilities, allAbilities, orderProperty = 'order') {
  const characterAbilityObjects = computed(() => {
    const allAbilitiesArray = allAbilities.value || []
    return (
      characterAbilities.value
        ?.map((abilityObj, index) => {
          const ability = allAbilitiesArray.find((a) => a.id === abilityObj.id)
          
          if (!ability) return null
          
          const { improvements: characterImprovements, ...otherMetadata } = abilityObj
          
          return { 
            ...ability,
            ...otherMetadata,
            improvements: ability.improvements || [],
            characterImprovements: characterImprovements || {},
            collapsed: abilityObj.collapsed ?? true,
            showImprovements: abilityObj.showImprovements ?? false,
            [orderProperty]: index 
          }
        })
        .filter((ability) => ability !== null) || []
    )
  })

  return {
    characterAbilityObjects
  }
}
