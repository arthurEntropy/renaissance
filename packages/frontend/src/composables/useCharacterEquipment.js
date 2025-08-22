import { computed } from 'vue'

/**
 * Composable for transforming character equipment entries to include full equipment data
 * Handles the pattern of looking up equipment by ID and merging with character's equipment data
 * @param {Ref} characterEquipment - Reactive reference to character's equipment array
 * @param {Ref} allEquipment - Reactive reference to all available equipment
 */
export function useCharacterEquipment(characterEquipment, allEquipment) {
  const characterEquipmentRows = computed(() => {
    const allEquipmentArray = allEquipment.value || []
    return characterEquipment.value?.map((entry) => {
      const equipment = allEquipmentArray.find((eq) => eq.id === entry.id)
      return {
        ...entry,
        equipment,
      }
    }) || []
  })

  return {
    characterEquipmentRows
  }
}
