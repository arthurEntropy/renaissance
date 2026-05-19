import BaseEntityService from './baseEntityService'
import { createDefaultCharacter } from '@shared/types'
import apiClient from '../api/apiClient'

class CharacterService extends BaseEntityService {
  constructor() {
    super('/characters', 'character')
  }

  getDefaultEntity() {
    return createDefaultCharacter()
  }

  addItem(character, itemsProperty, item) {
    if (!character || !item) return null
    if (!Array.isArray(character[itemsProperty])) character[itemsProperty] = []
    
    const currentItems = character[itemsProperty]
    
    // Always prevent duplicates by id
    const exists = currentItems.some(existingItem => existingItem.id === item.id)
    if (exists) return null

    return {
      ...character,
      [itemsProperty]: [...currentItems, item],
    }
  }

  removeItem(character, itemsProperty, index) {
    if (!character || !Array.isArray(character[itemsProperty])) return null
    if (index < 0 || index >= character[itemsProperty].length) return null

    return {
      ...character,
      [itemsProperty]: character[itemsProperty].filter((_, i) => i !== index),
    }
  }



  reorderItems(character, itemsProperty, newOrder) {
    if (!character || !Array.isArray(newOrder) || newOrder.length === 0) return null

    return {
      ...character,
      [itemsProperty]: newOrder,
    }
  }

  addAbilityToCharacter(character, ability) {
    return this.addItem(character, 'abilities', { 
      id: ability.id, 
      collapsed: false, 
      showImprovements: false,
      showSuccesses: false,
      isActive: false,
    })
  }

  addEquipmentToCharacter(character, equipment) {
    return this.addItem(character, 'equipment', {
      id: equipment.id,
      quantity: 1,
      isCarried: true,
    })
  }

  updateItem(character, itemsProperty, id, fields) {
    if (!character || !Array.isArray(character[itemsProperty])) return null
    const index = character[itemsProperty].findIndex((item) => item.id === id)
    if (index === -1) return null
    return {
      ...character,
      [itemsProperty]: character[itemsProperty].map((item, i) =>
        i === index ? { ...item, ...fields } : item,
      ),
    }
  }

  async transferOwnership(characterId, newOwnerId) {
    try {
      const response = await apiClient.post(`/characters/${characterId}/transfer-ownership`, { newOwnerId })
      return response.data
    } catch (error) {
      console.error('Error transferring character ownership:', error)
      throw error
    }
  }

  async transferEquipment(sourceCharacterId, equipmentId, recipientCharacterId, quantity) {
    try {
      const response = await apiClient.post(`/characters/${sourceCharacterId}/transfer-equipment`, {
        equipmentId,
        recipientCharacterId,
        quantity,
      })
      return response.data
    } catch (error) {
      console.error('Error transferring equipment:', error)
      throw error
    }
  }
}

export default new CharacterService()
