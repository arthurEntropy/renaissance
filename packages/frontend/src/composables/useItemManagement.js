import { computed } from 'vue'

/**
 * Composable for managing items in character data
 * Provides common patterns for add/remove/update operations on character item arrays
 * @param {Object} character - The character object
 * @param {Function} emit - The emit function from the component
 * @param {string} itemsProperty - The property name on character (e.g., 'abilities', 'equipment')
 * @param {string} itemName - Display name for the item type (e.g., 'ability', 'item')
 */
export function useItemManagement(character, emit, itemsProperty, itemName = 'item') {
  const items = computed(() => character.value?.[itemsProperty] || [])

  const addItem = (item, options = {}) => {
    const currentItems = items.value || []
    
    // Check for duplicates if specified
    if (options.preventDuplicates) {
      const exists = currentItems.some(existingItem => {
        if (options.compareProperty) {
          return existingItem[options.compareProperty] === item[options.compareProperty]
        }
        return existingItem === item || existingItem.id === item.id
      })
      
      if (exists) {
        return false // Item already exists
      }
    }

    const updatedItems = options.prepend 
      ? [item, ...currentItems]
      : [...currentItems, item]

    const updatedCharacter = {
      ...character.value,
      [itemsProperty]: updatedItems,
    }

    emit('update-character', updatedCharacter)
    return true
  }

  const removeItem = (index, options = {}) => {
    if (index < 0 || index >= items.value.length) return false

    const item = items.value[index]
    const displayName = options.getDisplayName 
      ? options.getDisplayName(item)
      : (item?.name || `this ${itemName}`)

    const confirmMessage = options.confirmMessage 
      ? options.confirmMessage(displayName)
      : `Are you sure you want to remove ${displayName}?`

    if (options.skipConfirm || confirm(confirmMessage)) {
      const updatedItems = items.value.filter((_, i) => i !== index)

      const updatedCharacter = {
        ...character.value,
        [itemsProperty]: updatedItems,
      }

      emit('update-character', updatedCharacter)
      return true
    }

    return false
  }

  const updateItem = (index, updates) => {
    if (index < 0 || index >= items.value.length) return false

    const updatedItems = [...items.value]
    updatedItems[index] = {
      ...updatedItems[index],
      ...updates,
    }

    const updatedCharacter = {
      ...character.value,
      [itemsProperty]: updatedItems,
    }

    emit('update-character', updatedCharacter)
    return true
  }

  const updateItemProperty = (index, property, value) => {
    return updateItem(index, { [property]: value })
  }

  const reorderItems = (newOrder) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) return false

    const updatedCharacter = {
      ...character.value,
      [itemsProperty]: newOrder,
    }

    emit('update-character', updatedCharacter)
    return true
  }

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    updateItemProperty,
    reorderItems
  }
}
