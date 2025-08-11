import { ref } from 'vue'

/**
 * Composable for managing dice counts and conversions
 * Handles conversion between dice arrays and count objects
 */
export function useDiceManagement(dieTypes = [4, 6, 8, 10, 12, 20]) {
  const diceCounts = ref({})

  const convertDiceListToCounts = (diceList) => {
    // Convert a list of dice (e.g., [4, 6, 6, 8]) to an object with counts
    const counts = {}
    dieTypes.forEach((dieType) => {
      counts[dieType] = diceList.filter((die) => die === dieType).length
    })
    return counts
  }

  const convertCountsToDiceList = (diceCounts) => {
    // Convert an object with counts (e.g., {4: 1, 6: 2, 8: 1}) to a list of dice
    const diceList = []
    Object.entries(diceCounts).forEach(([dieType, count]) => {
      for (let i = 0; i < count; i++) {
        diceList.push(Number(dieType))
      }
    })
    return diceList
  }

  const initializeCounts = (diceList) => {
    diceCounts.value = convertDiceListToCounts(diceList || [])
  }

  const getDiceList = () => {
    return convertCountsToDiceList(diceCounts.value)
  }

  const resetCounts = () => {
    const counts = {}
    dieTypes.forEach((dieType) => {
      counts[dieType] = 0
    })
    diceCounts.value = counts
  }

  return {
    dieTypes,
    diceCounts,
    convertDiceListToCounts,
    convertCountsToDiceList,
    initializeCounts,
    getDiceList,
    resetCounts
  }
}
