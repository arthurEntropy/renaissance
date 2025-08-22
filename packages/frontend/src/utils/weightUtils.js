/**
 * Utility functions for weight formatting and calculations
 */

/**
 * Format weight value for display
 * @param {number} value - Weight value to format
 * @returns {string} Formatted weight (integer or one decimal place)
 */
export function formatWeight(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

/**
 * Calculate total weight from equipment rows
 * @param {Array} equipmentRows - Array of equipment row objects
 * @returns {number} Total weight (rounded)
 */
export function calculateTotalWeight(equipmentRows) {
  return Math.round(
    equipmentRows.reduce((sum, row) => {
      if (!row.equipment) return sum
      return row.isCarried ? sum + row.equipment.weight * row.quantity : sum
    }, 0)
  )
}
