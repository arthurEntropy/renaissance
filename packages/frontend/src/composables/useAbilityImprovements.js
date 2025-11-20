/**
 * Composable for managing character ability improvements
 * Handles ID-based improvement tracking within the abilities array
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
    if (!character?.abilities) {
      return false
    }
    
    const ability = character.abilities.find(a => a.id === abilityId)
    return ability?.improvements?.[improvementId] || false
  }

  /**
   * Toggle an improvement for a character
   * @param {Object} character - The character object to modify
   * @param {string} abilityId - The ability ID
   * @param {string} improvementId - The improvement ID
   * @returns {Object} Updated character object
   */
  const toggleImprovement = (character, abilityId, improvementId) => {
    if (!character.abilities) {
      character.abilities = []
    }
    
    const ability = character.abilities.find(a => a.id === abilityId)
    
    if (!ability) {
      console.warn(`Cannot toggle improvement for unknown ability: ${abilityId}`)
      return { ...character }
    }
    
    // Ensure improvements object exists
    if (!ability.improvements) {
      ability.improvements = {}
    }
    
    // Toggle the improvement status
    const currentStatus = ability.improvements[improvementId] || false
    ability.improvements[improvementId] = !currentStatus
    
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
    if (!character.abilities) {
      character.abilities = []
    }
    
    const ability = character.abilities.find(a => a.id === abilityId)
    
    if (!ability) {
      console.warn(`Cannot add improvement to unknown ability: ${abilityId}`)
      return { ...character }
    }
    
    // Ensure improvements object exists
    if (!ability.improvements) {
      ability.improvements = {}
    }
    
    ability.improvements[improvementId] = true
    
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
    if (!character?.abilities) {
      return character
    }
    
    const ability = character.abilities.find(a => a.id === abilityId)
    
    if (!ability?.improvements) {
      return character
    }
    
    // Remove the specific improvement
    delete ability.improvements[improvementId]
    
    // Clean up empty improvements object
    if (Object.keys(ability.improvements).length === 0) {
      delete ability.improvements
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
    if (!character?.abilities) {
      return []
    }
    
    const ability = character.abilities.find(a => a.id === abilityId)
    
    if (!ability?.improvements) {
      return []
    }
    
    return Object.entries(ability.improvements)
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
    
    if (!character?.abilities) {
      return issues
    }

    // Create lookup map for validation
    const abilityMap = new Map(allAbilities.map(ability => [ability.id, ability]))
    
    character.abilities.forEach(charAbility => {
      if (!charAbility.improvements) {
        return
      }
      
      const abilityData = abilityMap.get(charAbility.id)
      
      if (!abilityData) {
        issues.push({
          type: 'missing_ability',
          abilityId: charAbility.id,
          message: `Character has improvements for unknown ability: ${charAbility.id}`
        })
        return
      }
      
      // Check each improvement
      Object.entries(charAbility.improvements).forEach(([improvementId, hasImprovement]) => {
        if (hasImprovement) {
          const improvementExists = abilityData.improvements?.some(imp => imp.id === improvementId)
          
          if (!improvementExists) {
            issues.push({
              type: 'missing_improvement',
              abilityId: charAbility.id,
              improvementId,
              abilityName: abilityData.name,
              message: `Character has unknown improvement ${improvementId} for ability ${abilityData.name}`
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
    
    // Create lookup map
    const abilityMap = new Map(allAbilities.map(ability => [ability.id, ability]))
    
    if (!character.abilities) {
      return character
    }
    
    // Clean up invalid references
    character.abilities.forEach(charAbility => {
      if (!charAbility.improvements) {
        return
      }
      
      const abilityData = abilityMap.get(charAbility.id)
      
      if (!abilityData) {
        console.warn(`Removing improvements for unknown ability: ${charAbility.id}`)
        delete charAbility.improvements
        return
      }
      
      const validImprovements = {}
      
      Object.entries(charAbility.improvements).forEach(([improvementId, hasImprovement]) => {
        if (hasImprovement) {
          const improvementExists = abilityData.improvements?.some(imp => imp.id === improvementId)
          
          if (improvementExists) {
            validImprovements[improvementId] = hasImprovement
          } else {
            console.warn(`Removing unknown improvement ${improvementId} from ability ${abilityData.name}`)
          }
        }
      })
      
      if (Object.keys(validImprovements).length > 0) {
        charAbility.improvements = validImprovements
      } else {
        delete charAbility.improvements
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