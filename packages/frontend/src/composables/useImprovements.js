export function useImprovements(itemType) {
  // itemType should be 'abilities' or 'equipment'
  const itemsProperty = itemType
  
  const hasImprovement = (character, itemId, improvementId) => {
    if (!character?.[itemsProperty]) {
      return false
    }
    
    const item = character[itemsProperty].find(i => i.id === itemId)
    return item?.improvements?.[improvementId] || false
  }

  const toggleImprovement = (character, itemId, improvementId) => {
    if (!character[itemsProperty]) {
      return {
        ...character,
        [itemsProperty]: []
      }
    }
    
    const itemIndex = character[itemsProperty].findIndex(i => i.id === itemId)
    
    if (itemIndex === -1) {
      console.warn(`Cannot toggle improvement for unknown ${itemType.slice(0, -1)}: ${itemId}`)
      return { ...character }
    }
    
    const item = character[itemsProperty][itemIndex]
    const currentImprovements = item.improvements || {}
    const currentStatus = currentImprovements[improvementId] || false
    
    // Create new improvements object
    const newImprovements = {
      ...currentImprovements,
      [improvementId]: !currentStatus
    }
    
    // Create new item with updated improvements
    const newItem = {
      ...item,
      improvements: newImprovements
    }
    
    // Create new items array with the updated item
    const newItems = [
      ...character[itemsProperty].slice(0, itemIndex),
      newItem,
      ...character[itemsProperty].slice(itemIndex + 1)
    ]
    
    // Return new character with updated items array
    return {
      ...character,
      [itemsProperty]: newItems
    }
  }

  const addImprovement = (character, itemId, improvementId) => {
    if (!character[itemsProperty]) {
      return {
        ...character,
        [itemsProperty]: []
      }
    }
    
    const itemIndex = character[itemsProperty].findIndex(i => i.id === itemId)
    
    if (itemIndex === -1) {
      console.warn(`Cannot add improvement to unknown ${itemType.slice(0, -1)}: ${itemId}`)
      return { ...character }
    }
    
    const item = character[itemsProperty][itemIndex]
    const currentImprovements = item.improvements || {}
    
    // Create new improvements object
    const newImprovements = {
      ...currentImprovements,
      [improvementId]: true
    }
    
    // Create new item with updated improvements
    const newItem = {
      ...item,
      improvements: newImprovements
    }
    
    // Create new items array with the updated item
    const newItems = [
      ...character[itemsProperty].slice(0, itemIndex),
      newItem,
      ...character[itemsProperty].slice(itemIndex + 1)
    ]
    
    // Return new character with updated items array
    return {
      ...character,
      [itemsProperty]: newItems
    }
  }

  const removeImprovement = (character, itemId, improvementId) => {
    if (!character?.[itemsProperty]) {
      return character
    }
    
    const itemIndex = character[itemsProperty].findIndex(i => i.id === itemId)
    
    if (itemIndex === -1 || !character[itemsProperty][itemIndex]?.improvements) {
      return character
    }
    
    const item = character[itemsProperty][itemIndex]
    const currentImprovements = { ...item.improvements }
    
    // Remove the specific improvement
    delete currentImprovements[improvementId]
    
    // Create new item
    const newItem = { ...item }
    
    // Clean up empty improvements object or set new improvements
    if (Object.keys(currentImprovements).length === 0) {
      delete newItem.improvements
    } else {
      newItem.improvements = currentImprovements
    }
    
    // Create new items array with the updated item
    const newItems = [
      ...character[itemsProperty].slice(0, itemIndex),
      newItem,
      ...character[itemsProperty].slice(itemIndex + 1)
    ]
    
    // Return new character with updated items array
    return {
      ...character,
      [itemsProperty]: newItems
    }
  }

  const getCharacterImprovements = (character, itemId) => {
    if (!character?.[itemsProperty]) {
      return []
    }
    
    const item = character[itemsProperty].find(i => i.id === itemId)
    
    if (!item?.improvements) {
      return []
    }
    
    return Object.entries(item.improvements)
      .filter(([_, hasImprovement]) => hasImprovement)
      .map(([improvementId, _]) => improvementId)
  }

  const validateCharacterImprovements = (character, allItems) => {
    const issues = []
    
    if (!character?.[itemsProperty]) {
      return issues
    }

    // Create lookup map for validation
    const itemMap = new Map(allItems.map(item => [item.id, item]))
    
    character[itemsProperty].forEach(charItem => {
      if (!charItem.improvements) {
        return
      }
      
      const itemData = itemMap.get(charItem.id)
      
      if (!itemData) {
        issues.push({
          type: `missing_${itemType.slice(0, -1)}`,
          itemId: charItem.id,
          message: `Character has improvements for unknown ${itemType.slice(0, -1)}: ${charItem.id}`
        })
        return
      }
      
      // Check each improvement
      Object.entries(charItem.improvements).forEach(([improvementId, hasImprovement]) => {
        if (hasImprovement) {
          const improvementExists = itemData.improvements?.some(imp => imp.id === improvementId)
          
          if (!improvementExists) {
            issues.push({
              type: 'missing_improvement',
              itemId: charItem.id,
              improvementId,
              itemName: itemData.name,
              message: `Character has unknown improvement ${improvementId} for ${itemType.slice(0, -1)} ${itemData.name}`
            })
          }
        }
      })
    })
    
    return issues
  }

  const cleanupCharacterImprovements = (character, allItems) => {
    const issues = validateCharacterImprovements(character, allItems)
    
    if (issues.length === 0) {
      return character
    }
    
    console.warn(`Cleaning up ${issues.length} invalid improvement references`)
    
    // Create lookup map
    const itemMap = new Map(allItems.map(item => [item.id, item]))
    
    if (!character[itemsProperty]) {
      return character
    }
    
    // Clean up invalid references
    character[itemsProperty].forEach(charItem => {
      if (!charItem.improvements) {
        return
      }
      
      const itemData = itemMap.get(charItem.id)
      
      if (!itemData) {
        console.warn(`Removing improvements for unknown ${itemType.slice(0, -1)}: ${charItem.id}`)
        delete charItem.improvements
        return
      }
      
      const validImprovements = {}
      
      Object.entries(charItem.improvements).forEach(([improvementId, hasImprovement]) => {
        if (hasImprovement) {
          const improvementExists = itemData.improvements?.some(imp => imp.id === improvementId)
          
          if (improvementExists) {
            validImprovements[improvementId] = hasImprovement
          } else {
            console.warn(`Removing unknown improvement ${improvementId} from ${itemType.slice(0, -1)} ${itemData.name}`)
          }
        }
      })
      
      if (Object.keys(validImprovements).length > 0) {
        charItem.improvements = validImprovements
      } else {
        delete charItem.improvements
      }
    })
    
    return { ...character }
  }

  return {
    hasImprovement,
    toggleImprovement,
    addImprovement,
    removeImprovement,
    getCharacterImprovements,
    validateCharacterImprovements,
    cleanupCharacterImprovements
  }
}
