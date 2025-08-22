import { ref } from 'vue'
import EquipmentService from '@/services/equipmentService'
import CharacterService from '@/services/characterService'
import { useEquipmentStore } from '@/stores/equipmentStore'

/**
 * Composable for handling custom equipment creation and management
 * Provides functionality to create custom equipment and add it to characters
 */
export function useCustomEquipment(character, emit) {
  const equipmentStore = useEquipmentStore()
  const isCreatingCustom = ref(false)

  const createAndAddCustomEquipment = async () => {
    if (isCreatingCustom.value) return

    isCreatingCustom.value = true
    
    try {
      const createdEquipment = await EquipmentService.createCustomEquipment()

      const newItem = {
        id: createdEquipment.id,
        quantity: 1,
        isCarried: true,
        isWielding: false,
      }

      CharacterService.addSpecificEquipmentItem(character.value, newItem)
      emit('update-character', character.value)

      await equipmentStore.fetch()

      const fullEquipment = (equipmentStore.equipment || []).find(
        (eq) => eq.id === createdEquipment.id
      )

      if (fullEquipment) {
        emit('edit-custom-equipment', fullEquipment)
      } else {
        emit('edit-custom-equipment', createdEquipment.id)
      }

      return fullEquipment || createdEquipment
    } catch (error) {
      console.error('Error adding custom equipment:', error)
      throw error
    } finally {
      isCreatingCustom.value = false
    }
  }

  return {
    isCreatingCustom,
    createAndAddCustomEquipment
  }
}
