import { ref, computed } from 'vue'
import EngagementSuccessService from '@/services/EngagementSuccessService'

export function useEngagementSuccesses(character = null, allEquipment = null) {
  // State
  const allEngagementSuccesses = ref([])

  // Computed properties for success data processing
  const equipmentEngagementSuccesses = computed(() => {
    const result = []

    if (!character?.value?.equipment || !allEquipment?.value) {
      return result
    }

    character.value.equipment.forEach(characterEquip => {
      const equipment = allEquipment.value.find(eq => eq.id === characterEquip.id)

      if (characterEquip.isWielding && equipment?.engagementSuccesses?.length > 0) {
        equipment.engagementSuccesses.forEach(successId => {
          const success = allEngagementSuccesses.value.find(s => s.id === successId)
          if (success) {
            result.push({
              ...success,
              isUserAdded: false,
              sources: [equipment.name]
            })
          }
        })
      }
    })

    return result
  })

  const userAddedEngagementSuccesses = computed(() => {
    const rawSuccessIds = character?.value?.engagementSuccesses || []
    return rawSuccessIds.map(successId => {
      const success = allEngagementSuccesses.value.find(s => s.id === successId)
      if (success) {
        return {
          ...success,
          isUserAdded: true,
          sources: ['Added manually'] // Label for user-added successes in tooltips
        }
      }
      return null
    }).filter(Boolean)
  })

  const allOwnedEngagementSuccesses = computed(() => {
    const allSuccesses = [
      ...equipmentEngagementSuccesses.value,
      ...userAddedEngagementSuccesses.value
    ]

    // Ensure unique successes by ID
    const successMap = new Map()

    allSuccesses.forEach(success => {
      if (successMap.has(success.id)) {
        const existing = successMap.get(success.id)
        // Merge sources from all instances
        existing.sources = [...new Set([...existing.sources, ...success.sources])]
        // If any instance is user-added, mark as user-added
        if (success.isUserAdded) {
          existing.isUserAdded = true
        }
      } else {
        successMap.set(success.id, { ...success })
      }
    })

    // Convert back to array and sort by name
    return Array.from(successMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  })

  // Engagement successes available for user to add (not already owned)
  const availableEngagementSuccesses = computed(() => {
    const ownedIds = new Set(allOwnedEngagementSuccesses.value.map(success => success.id))

    return allEngagementSuccesses.value
      .filter(success => !ownedIds.has(success.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  // Methods
  const fetchEngagementSuccesses = async () => {
    try {
      allEngagementSuccesses.value = await EngagementSuccessService.getAllEngagementSuccesses()
    } catch (error) {
      console.error("Error fetching engagement successes:", error)
      allEngagementSuccesses.value = []
    }
  }

  const addUserAddedSuccess = (successId, updateCharacterCallback) => {
    if (!character?.value || !updateCharacterCallback) return

    const currentSuccesses = character.value.engagementSuccesses || []
    const updatedSuccesses = [...currentSuccesses, successId]

    const updatedCharacter = {
      ...character.value,
      engagementSuccesses: updatedSuccesses
    }

    updateCharacterCallback(updatedCharacter)
  }

  const removeUserAddedSuccess = (successId, updateCharacterCallback) => {
    if (!character?.value || !updateCharacterCallback) return

    const currentSuccesses = character.value.engagementSuccesses || []
    const updatedSuccesses = currentSuccesses.filter(id => id !== successId)

    const updatedCharacter = {
      ...character.value,
      engagementSuccesses: updatedSuccesses
    }

    updateCharacterCallback(updatedCharacter)
  }

  return {
    // State
    allEngagementSuccesses,
    
    // Computed properties
    equipmentEngagementSuccesses,
    userAddedEngagementSuccesses,
    allOwnedEngagementSuccesses,
    availableEngagementSuccesses,
    
    // Methods
    fetchEngagementSuccesses,
    addUserAddedSuccess,
    removeUserAddedSuccess
  }
}
