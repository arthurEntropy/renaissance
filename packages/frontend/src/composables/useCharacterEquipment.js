import { computed } from 'vue'

// Merges character equipment entries with full equipment definitions.
// Character data stores minimal entries: {id, quantity, isCarried, isWielding, collapsed, etc.}
// This composable joins them with full equipment definitions from the master equipment list,
// avoiding data duplication while maintaining character-specific state like quantity and carry status.
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
