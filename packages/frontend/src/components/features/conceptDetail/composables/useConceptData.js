import { ref, watch } from 'vue'
import AbilityService from '@/services/abilityService'
import EquipmentService from '@/services/equipmentService'

/**
 * Composable for managing concept-related data fetching
 */
export function useConceptData(concept) {
  const abilities = ref([])
  const equipment = ref([])

  const fetchAbilities = async () => {
    try {
      const allAbilities = await AbilityService.getAllAbilities()
      abilities.value = allAbilities.filter(
        (ability) => ability.source === concept.value.id,
      )
    } catch (error) {
      console.error('Error fetching abilities:', error)
    }
  }

  const fetchEquipment = async () => {
    try {
      const allEquipment = await EquipmentService.getAllEquipment()
      equipment.value = allEquipment.filter(
        (item) => item.source === concept.value.id,
      )
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const refreshData = () => {
    fetchAbilities()
    fetchEquipment()
  }

  // Watch for concept changes and refresh data
  watch(() => concept.value.id, refreshData, { immediate: true })

  return {
    abilities,
    equipment,
    fetchAbilities,
    fetchEquipment,
    refreshData
  }
}
