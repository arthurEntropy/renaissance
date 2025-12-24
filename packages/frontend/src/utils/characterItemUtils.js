/**
 * Utility functions for managing character items (equipment, abilities, etc.)
 * Provides consistent patterns for updating item properties with proper Vue reactivity
 */

/**
 * Updates a property on a character item by ID
 * Creates new array references to ensure Vue reactivity
 * 
 * @param {Object} character - The character object
 * @param {string} itemType - The type of items ('equipment', 'abilities', etc.)
 * @param {string} itemId - The ID of the item to update
 * @param {string} propertyName - The name of the property to update
 * @param {*} value - The new value for the property
 * @returns {boolean} - True if update was successful, false otherwise
 */
export function updateItemProperty(character, itemType, itemId, propertyName, value) {
  if (!character?.[itemType]) return false
  
  const index = character[itemType].findIndex(item => item.id === itemId)
  if (index === -1) return false
  
  // Create a copy of the item with the updated property
  const updatedItem = { ...character[itemType][index], [propertyName]: value }
  
  // Create a copy of the items array with the updated item to ensure reactivity
  const newItems = [...character[itemType]]
  newItems[index] = updatedItem
  
  // Update the character's items array
  character[itemType] = newItems
  
  return true
}

/**
 * Updates multiple properties on a character item by ID
 * 
 * @param {Object} character - The character object
 * @param {string} itemType - The type of items ('equipment', 'abilities', etc.)
 * @param {string} itemId - The ID of the item to update
 * @param {Object} updates - Object containing property names and values to update
 * @returns {boolean} - True if update was successful, false otherwise
 */
export function updateItemProperties(character, itemType, itemId, updates) {
  if (!character?.[itemType]) return false
  
  const index = character[itemType].findIndex(item => item.id === itemId)
  if (index === -1) return false
  
  // Create a copy of the item with all updated properties
  const updatedItem = { ...character[itemType][index], ...updates }
  
  // Create a copy of the items array with the updated item to ensure reactivity
  const newItems = [...character[itemType]]
  newItems[index] = updatedItem
  
  // Update the character's items array
  character[itemType] = newItems
  
  return true
}

/**
 * Gets the index of an item in a character's item list
 * 
 * @param {Object} character - The character object
 * @param {string} itemType - The type of items ('equipment', 'abilities', etc.)
 * @param {string} itemId - The ID of the item to find
 * @returns {number} - The index of the item, or -1 if not found
 */
export function getItemIndex(character, itemType, itemId) {
  if (!character?.[itemType]) return -1
  return character[itemType].findIndex(item => item.id === itemId)
}
