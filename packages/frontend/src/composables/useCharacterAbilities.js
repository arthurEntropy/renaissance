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
          
          // Extract character-specific metadata (excluding 'improvements' which is special)
          const characterMetadata = typeof abilityObj === 'object' ? abilityObj : {}
          const { improvements: characterImprovements, ...otherMetadata } = characterMetadata
          
          return { 
            ...ability, // Base ability data with improvements array (definitions)
            ...otherMetadata, // Character-specific metadata (collapsed, showImprovements, etc.)
            // Explicitly preserve the improvements array from the ability definition
            improvements: ability.improvements || [],
            // Store character's improvement ownership separately if needed
            characterImprovements: characterImprovements || {},
            // Provide defaults for UI state properties
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
