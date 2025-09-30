/**
 * Composable for managing character ability improvements
 * Handles ID-based improvement tracking
 */
export function useAbilityImprovements() {
  
  /**
   * Check if a character has a specific improvement
   * @param {Object} character - The character object
   * @param {string} abilityId - The ability ID
   * @param {string} improvementId - The improvement ID
   * @returns {boolean} Whether the character has the improvement
   */
  const hasImprovement = (character, abilityId, improvementId) => {
    if (!character?.abilityImprovements) {
      return false
    }
    
    return character.abilityImprovements[abilityId]?.[improvementId] || false
  }

  /**
   * Toggle an improvement for a character
   * @param {Object} character - The character object to modify
   * @param {string} abilityId - The ability ID
   * @param {string} improvementId - The improvement ID
   * @returns {Object} Updated character object
   */
  const toggleImprovement = (character, abilityId, improvementId) => {
    // Ensure the abilityImprovements structure exists
    if (!character.abilityImprovements) {
      character.abilityImprovements = {}
    }
    
    if (!character.abilityImprovements[abilityId]) {
      character.abilityImprovements[abilityId] = {}
    }
    
    // Toggle the improvement status
    const currentStatus = character.abilityImprovements[abilityId][improvementId] || false
    character.abilityImprovements[abilityId][improvementId] = !currentStatus
    
    return { ...character }
  }

  /**
   * Add an improvement to a character
   * @param {Object} character - The character object to modify
   * @param {string} abilityId - The ability ID
   * @param {string} improvementId - The improvement ID
   * @returns {Object} Updated character object
   */
  const addImprovement = (character, abilityId, improvementId) => {
    // Ensure the abilityImprovements structure exists
    if (!character.abilityImprovements) {
      character.abilityImprovements = {}
    }
    
    if (!character.abilityImprovements[abilityId]) {
      character.abilityImprovements[abilityId] = {}
    }
    
    character.abilityImprovements[abilityId][improvementId] = true
    
    return { ...character }
  }

  /**
   * Remove an improvement from a character
   * @param {Object} character - The character object to modify
   * @param {string} abilityId - The ability ID
   * @param {string} improvementId - The improvement ID
   * @returns {Object} Updated character object
   */
  const removeImprovement = (character, abilityId, improvementId) => {
    if (!character?.abilityImprovements?.[abilityId]) {
      return character
    }
    
    // Remove the specific improvement
    delete character.abilityImprovements[abilityId][improvementId]
    
    // Clean up empty ability objects
    if (Object.keys(character.abilityImprovements[abilityId]).length === 0) {
      delete character.abilityImprovements[abilityId]
    }
    
    // Clean up empty abilityImprovements object
    if (Object.keys(character.abilityImprovements).length === 0) {
      delete character.abilityImprovements
    }
    
    return { ...character }
  }

  /**
   * Get all improvements for a specific ability that the character has
   * @param {Object} character - The character object
   * @param {string} abilityId - The ability ID
   * @returns {Array} Array of improvement IDs the character has
   */
  const getCharacterImprovements = (character, abilityId) => {
    if (!character?.abilityImprovements?.[abilityId]) {
      return []
    }
    
    return Object.entries(character.abilityImprovements[abilityId])
      .filter(([_, hasImprovement]) => hasImprovement)
      .map(([improvementId, _]) => improvementId)
  }

  /**
   * Validate that all referenced improvements exist in the abilities data
   * @param {Object} character - The character object
   * @param {Array} allAbilities - All abilities with their improvements
   * @returns {Array} Array of validation issues
   */
  const validateCharacterImprovements = (character, allAbilities) => {
    const issues = []
    
    if (!character?.abilityImprovements) {
      return issues
    }

    // Create lookup maps for validation
    const abilityMap = new Map(allAbilities.map(ability => [ability.id, ability]))
    
    Object.entries(character.abilityImprovements).forEach(([abilityId, improvements]) => {
      const ability = abilityMap.get(abilityId)
      
      if (!ability) {
        issues.push({
          type: 'missing_ability',
          abilityId,
          message: `Character has improvements for unknown ability: ${abilityId}`
        })
        return
      }
      
      // Check each improvement
      Object.entries(improvements).forEach(([improvementId, hasImprovement]) => {
        if (hasImprovement) {
          const improvementExists = ability.improvements?.some(imp => imp.id === improvementId)
          
          if (!improvementExists) {
            issues.push({
              type: 'missing_improvement',
              abilityId,
              improvementId,
              abilityName: ability.name,
              message: `Character has unknown improvement ${improvementId} for ability ${ability.name}`
            })
          }
        }
      })
    })
    
    return issues
  }

  /**
   * Clean up invalid improvement references from character data
   * @param {Object} character - The character object to clean
   * @param {Array} allAbilities - All abilities with their improvements
   * @returns {Object} Cleaned character object
   */
  const cleanupCharacterImprovements = (character, allAbilities) => {
    const issues = validateCharacterImprovements(character, allAbilities)
    
    if (issues.length === 0) {
      return character
    }
    
    console.warn(`Cleaning up ${issues.length} invalid improvement references`)
    
    // Create lookup maps
    const abilityMap = new Map(allAbilities.map(ability => [ability.id, ability]))
    
    if (!character.abilityImprovements) {
      return character
    }
    
    // Clean up invalid references
    const cleanedImprovements = {}
    
    Object.entries(character.abilityImprovements).forEach(([abilityId, improvements]) => {
      const ability = abilityMap.get(abilityId)
      
      if (!ability) {
        console.warn(`Removing improvements for unknown ability: ${abilityId}`)
        return
      }
      
      const validImprovements = {}
      
      Object.entries(improvements).forEach(([improvementId, hasImprovement]) => {
        if (hasImprovement) {
          const improvementExists = ability.improvements?.some(imp => imp.id === improvementId)
          
          if (improvementExists) {
            validImprovements[improvementId] = hasImprovement
          } else {
            console.warn(`Removing unknown improvement ${improvementId} from ability ${ability.name}`)
          }
        }
      })
      
      if (Object.keys(validImprovements).length > 0) {
        cleanedImprovements[abilityId] = validImprovements
      }
    })
    
    return {
      ...character,
      abilityImprovements: cleanedImprovements
    }
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