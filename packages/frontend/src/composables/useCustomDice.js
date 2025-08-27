import { ref, computed } from 'vue'
import { useDiceManagement } from './useDiceManagement'
import CustomRollService from '@/services/customRollService'

/**
 * Composable for managing custom dice rolls
 * Handles dice counts, modifiers, and roll execution
 */
export function useCustomDice(character) {
  // Use base dice management for core functionality
  const { dieTypes, diceCounts, resetCounts, getDiceList } = useDiceManagement([4, 6, 8, 10, 12, 20])
  
  // Custom roll specific state
  const modifier = ref(0)
  const isRolling = ref(false)
  
  // Initialize with empty dice counts
  resetCounts()

  // Computed properties
  const hasAnyDice = computed(() => {
    return Object.values(diceCounts.value).some(count => count > 0)
  })

  const totalDiceCount = computed(() => {
    return Object.values(diceCounts.value).reduce((sum, count) => sum + count, 0)
  })

  // Methods
  const updateDiceCount = (dieType, count) => {
    const validCount = Math.max(0, Math.min(10, count || 0)) // Cap at 10 dice per type
    diceCounts.value[dieType] = validCount
  }

  const incrementDice = (dieType) => {
    if (diceCounts.value[dieType] < 10) {
      diceCounts.value[dieType]++
    }
  }

  const decrementDice = (dieType) => {
    if (diceCounts.value[dieType] > 0) {
      diceCounts.value[dieType]--
    }
  }

  const clearAllDice = () => {
    resetCounts()
    modifier.value = 0
  }

  const rollDice = async () => {
    if (!hasAnyDice.value || isRolling.value) {
      return null
    }

    isRolling.value = true

    try {
      // Convert dice counts to dice pool format expected by service
      const dicePool = []
      
      Object.entries(diceCounts.value).forEach(([dieType, count]) => {
        for (let i = 0; i < count; i++) {
          dicePool.push({ sides: parseInt(dieType) })
        }
      })

      // Make the roll using the service
      const rollResult = CustomRollService.makeCustomRoll(
        dicePool,
        modifier.value,
        character?.value || { name: 'Unknown Character', artUrls: [''] }
      )

      return rollResult
    } catch (error) {
      console.error('Error making custom roll:', error)
      return null
    } finally {
      // Add a small delay to prevent rapid successive rolls
      setTimeout(() => {
        isRolling.value = false
      }, 500)
    }
  }

  const getDisplaySummary = () => {
    const diceList = []
    
    Object.entries(diceCounts.value).forEach(([dieType, count]) => {
      if (count > 0) {
        diceList.push(`${count}d${dieType}`)
      }
    })

    let summary = diceList.join(' + ')
    
    if (modifier.value !== 0) {
      const modifierStr = modifier.value > 0 ? `+${modifier.value}` : `${modifier.value}`
      summary += ` ${modifierStr}`
    }

    return summary || 'No dice selected'
  }

  return {
    // State
    dieTypes,
    diceCounts,
    modifier,
    isRolling,
    
    // Computed
    hasAnyDice,
    totalDiceCount,
    
    // Methods
    updateDiceCount,
    incrementDice,
    decrementDice,
    clearAllDice,
    rollDice,
    getDisplaySummary
  }
}
