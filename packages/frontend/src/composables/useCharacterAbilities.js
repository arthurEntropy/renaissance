import { computed } from 'vue'

/**
 * Composable for transforming character ability IDs to full ability objects
 * Handles the pattern of looking up abilities by ID and adding order/index
 * @param {Ref} characterAbilities - Reactive reference to character's ability IDs array
 * @param {Ref} allAbilities - Reactive reference to all available abilities
 * @param {string} orderProperty - Property name for ordering (default: 'order')
 */
export function useCharacterAbilities(characterAbilities, allAbilities, orderProperty = 'order') {
  const characterAbilityObjects = computed(() => {
    const allAbilitiesArray = allAbilities.value || []
    return (
      characterAbilities.value
        ?.map((abilityId, index) => {
          const ability = allAbilitiesArray.find((ability) => ability.id === abilityId)
          return ability ? { ...ability, [orderProperty]: index } : null
        })
        .filter((ability) => ability !== null) || []
    )
  })

  return {
    characterAbilityObjects
  }
}
