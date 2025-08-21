import { ref } from 'vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import EquipmentService from '@/services/equipmentService'

/**
 * Composable for managing equipment editing and related modals
 * Handles equipment CRUD operations and modal state
 */
export function useEquipmentManagement() {
  const equipmentStore = useEquipmentStore()
  
  const showEditEquipmentModal = ref(false)
  const equipmentToEdit = ref(null)

  const openEditEquipmentModal = (equipment) => {
    equipmentToEdit.value = equipment
    showEditEquipmentModal.value = true
  }

  const closeEditEquipmentModal = () => {
    showEditEquipmentModal.value = false
    equipmentToEdit.value = null
  }

  const saveEditedEquipment = async (updatedEquipment) => {
    try {
      // Save the updated equipment to the backend
      await EquipmentService.updateEquipment(updatedEquipment)

      // Refresh the equipment list to ensure the new item is included
      await equipmentStore.fetch()

      // The character will be automatically updated through watchers
    } catch (error) {
      console.error('Error saving equipment:', error)
      throw error // Re-throw to allow caller to handle
    }
  }

  return {
    showEditEquipmentModal,
    equipmentToEdit,
    openEditEquipmentModal,
    closeEditEquipmentModal,
    saveEditedEquipment
  }
}
