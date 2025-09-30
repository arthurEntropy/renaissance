import { computed } from 'vue'

/**
 * Composable for transforming character ability objects to full ability objects with metadata
 * Handles the pattern of looking up abilities by ID and preserving character-specific metadata
 * @param {Ref} characterAbilities - Reactive reference to character's ability objects array
 * @param {Ref} allAbilities - Reactive reference to all available abilities
 * @param {string} orderProperty - Property name for ordering (default: 'order')
 */
export function useCharacterAbilities(characterAbilities, allAbilities, orderProperty = 'order') {
  const characterAbilityObjects = computed(() => {
    const allAbilitiesArray = allAbilities.value || []
    return (
      characterAbilities.value
        ?.map((abilityObj, index) => {
          // Handle both old format (ID strings) and new format (objects with id)
          const abilityId = typeof abilityObj === 'string' ? abilityObj : abilityObj.id
          const ability = allAbilitiesArray.find((ability) => ability.id === abilityId)
          
          if (!ability) return null
          
          // Merge the base ability with character-specific metadata
          const characterMetadata = typeof abilityObj === 'object' ? abilityObj : {}
          
          return { 
            ...ability, 
            ...characterMetadata, // Includes collapsed state and any other character-specific data
            // Provide defaults for new properties
            collapsed: characterMetadata.collapsed ?? true,
            showImprovements: characterMetadata.showImprovements ?? false,
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
