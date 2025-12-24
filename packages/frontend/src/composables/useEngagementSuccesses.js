import { ref, computed, reactive } from 'vue'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import engagementSessionService from '@/services/sessions/engagementSessionService'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'

// Singleton state - shared across all instances
let sharedState = null

function createSharedState() {
  const charactersStore = useCharactersStore()
  const equipmentStore = useEquipmentStore()
  
  const character = computed(() => charactersStore.selectedCharacter)
  const allEquipment = computed(() => equipmentStore.equipment || [])
  const allEngagementSuccesses = ref([])
  const assignedSuccesses = reactive({})

  return {
    character,
    allEquipment,
    allEngagementSuccesses,
    assignedSuccesses
  }
}

export function useEngagementSuccesses() {
  // Initialize singleton state on first use
  if (!sharedState) {
    sharedState = createSharedState()
  }

  const { character, allEquipment, allEngagementSuccesses, assignedSuccesses } = sharedState

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
          sources: ['(added manually)'] // Label for user-added successes in tooltips
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
      allEngagementSuccesses.value = await EngagementSuccessService.getAll()
    } catch (error) {
      console.error("Error fetching engagement successes:", error)
      allEngagementSuccesses.value = []
    }
  }

  const addUserAddedSuccess = (successId) => {
    if (!character?.value) return

    if (!character.value.engagementSuccesses) {
      character.value.engagementSuccesses = []
    }
    character.value.engagementSuccesses.push(successId)
  }

  const removeUserAddedSuccess = (successId) => {
    if (!character?.value?.engagementSuccesses) return

    const index = character.value.engagementSuccesses.indexOf(successId)
    if (index > -1) {
      character.value.engagementSuccesses.splice(index, 1)
    }
  }

  // Success assignment management
  const assignSuccess = (player, diceIndex, successData, characterId) => {
    const key = `${player}-${diceIndex}`
    const previousAssignment = assignedSuccesses[key]
    const newAssignment = successData.id

    if (previousAssignment !== newAssignment) {
      assignedSuccesses[key] = newAssignment
      engagementSessionService.updateSuccessAssignment(characterId, player, diceIndex, newAssignment)
    }
  }

  const clearAssignment = (player, diceIndex, characterId) => {
    const key = `${player}-${diceIndex}`

    if (assignedSuccesses[key]) {
      delete assignedSuccesses[key]
      engagementSessionService.updateSuccessAssignment(characterId, player, diceIndex, null)
    }
  }

  const handleRemoteAssignment = (characterId, player, diceIndex, successId, currentCharacterId, opponent) => {
    if (characterId === currentCharacterId) return

    let targetKey
    if (opponent && opponent.characterInfo && characterId === opponent.characterInfo.id) {
      targetKey = `opponent-${diceIndex}`
    } else {
      console.warn('Unknown character ID for remote assignment:', characterId, 'opponent:', opponent)
      return
    }

    if (successId) {
      assignedSuccesses[targetKey] = successId
    } else {
      delete assignedSuccesses[targetKey]
    }
  }

  const resetAssignments = () => {
    Object.keys(assignedSuccesses).forEach(key => delete assignedSuccesses[key])
  }

  return {
    // State
    allEngagementSuccesses,
    assignedSuccesses,
    
    // Computed properties
    equipmentEngagementSuccesses,
    userAddedEngagementSuccesses,
    allOwnedEngagementSuccesses,
    availableEngagementSuccesses,
    
    // Methods
    fetchEngagementSuccesses,
    addUserAddedSuccess,
    removeUserAddedSuccess,
    assignSuccess,
    clearAssignment,
    handleRemoteAssignment,
    resetAssignments
  }
}
