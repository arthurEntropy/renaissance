import {
  getDirectory,
  getAllDataByDirectory,
  getAllCharacterData,
  getCharacterRecordById,
  saveCharacterFile,
  deleteCharacterById,
  getAllConceptData,
  getConceptRecordById,
  saveConceptFile,
  deleteConceptById,
  saveFile,
  deleteFile,
} from '../utils/fileService.js'
import { USER_ROLE } from '../../../shared/constants/userConstants.js'
import { CAMPAIGN_MEMBER_STATUS } from '../../../shared/constants/campaignConstants.js'

// These are generic CRUD operations for all data entities.
// They are designed to be used with the routes defined in server.js.
// The routes are created dynamically based on the entity names in the "data" directory.

const getUserCampaignIds = (userId) => {
  try {
    const campaignsDir = getDirectory('campaigns')
    const allCampaigns = getAllDataByDirectory(campaignsDir).filter((c) => !c.isDeleted)
    return allCampaigns
      .filter((c) => c.members?.some((m) => m.userId === userId && m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED))
      .map((c) => c.id)
  } catch {
    return []
  }
}

const getAllEntities = (entity) => (req, res) => {
  try {
    const allEntities = entity === 'characters'
      ? getAllCharacterData()
      : entity === 'concepts'
      ? getAllConceptData()
      : getAllDataByDirectory(getDirectory(entity))
    let filteredEntities = allEntities.filter((e) => !e.isDeleted)
    
    // For characters, filter by ownership unless user is admin
    if (entity === 'characters') {
      if (!req.user) {
        // Unauthenticated visitors: return only public preview characters
        filteredEntities = filteredEntities.filter(character => character.isPublicPreview)
      } else if (req.user.role !== USER_ROLE.ADMIN) {
        // Include characters owned by this user AND campaign characters from campaigns they belong to
        const memberCampaignIds = getUserCampaignIds(req.user.uid)
        filteredEntities = filteredEntities.filter(character =>
          character.ownerId === req.user.uid ||
          (character.campaignId && memberCampaignIds.includes(character.campaignId) && character.characterType !== 'playerCharacter')
        )
      }
    }
    
    res.json(filteredEntities)
  } catch (err) {
    console.error(`Error reading ${entity} directory:`, err)
    res.status(500).json({ error: `Error reading ${entity} directory` })
  }
}

const createEntity = (entity) => (req, res) => {
  try {
    const directory = entity === 'characters' || entity === 'concepts' ? null : getDirectory(entity)

    // For characters, add owner information
    if (entity === 'characters' && req.user) {
      req.body.ownerId = req.user.uid
      req.body.createdAt = new Date().toISOString()
    }

    if (entity === 'characters') {
      saveCharacterFile(req.body)
    } else if (entity === 'concepts') {
      saveConceptFile(req.body)
    } else {
      saveFile(req.body, directory)
    }
    
    // Return the full saved entity (saveFile modifies req.body with id, timestamps, etc.)
    res.status(201).json(req.body)
  } catch (error) {
    console.error(`Error creating new record in ${entity}:`, error)
    res.status(500).json({ error: `Error creating new record in ${entity}` })
  }
}

const updateEntity = (entity) => (req, res) => {
  try {
    const directory = entity === 'characters' || entity === 'concepts' ? null : getDirectory(entity)
    let existingEntity
    if (entity === 'characters') {
      existingEntity = getCharacterRecordById(req.body.id)
    } else if (entity === 'concepts') {
      const record = getConceptRecordById(req.body.id)
      existingEntity = record ? { character: record.concept, directory: record.directory } : null
    } else {
      existingEntity = { character: getAllDataByDirectory(directory).find((e) => e.id === req.body.id), directory }
    }

    if (!existingEntity?.character) {
      return res.status(404).json({ error: `No record found to update in ${entity}` })
    }
    
    // For characters, check ownership unless user is admin
    if (entity === 'characters' && req.user && req.user.role !== USER_ROLE.ADMIN) {
      if (existingEntity.character.ownerId !== req.user.uid) {
        return res.status(403).json({ error: 'You can only update your own characters' })
      }
    }
    
    // Preserve ownership information
    if (entity === 'characters') {
      req.body.ownerId = existingEntity.character.ownerId
      req.body.updatedAt = new Date().toISOString()
    }

    if (entity === 'characters') {
      saveCharacterFile(req.body, {
        oldName: existingEntity.character.name,
        existingId: existingEntity.character.id,
        existingDirectory: existingEntity.directory,
      })
    } else if (entity === 'concepts') {
      saveConceptFile(req.body, {
        oldName: existingEntity.character.name,
        existingId: existingEntity.character.id,
        existingDirectory: existingEntity.directory,
      })
    } else {
      saveFile(req.body, directory, existingEntity.character.name, existingEntity.character.id)
    }
    
    // Return the updated entity
    res.status(200).json(req.body)
  } catch (error) {
    console.error(`Error updating record in ${entity}:`, error)
    res.status(500).json({ error: `Failed to update record in ${entity}` })
  }
}

const deleteEntity = (entity) => (req, res) => {
  try {
    const directory = entity === 'characters' || entity === 'concepts' ? null : getDirectory(entity)
    let entityToDelete
    if (entity === 'characters') {
      entityToDelete = getCharacterRecordById(req.params.id)?.character
    } else if (entity === 'concepts') {
      entityToDelete = getConceptRecordById(req.params.id)?.concept
    } else {
      entityToDelete = getAllDataByDirectory(directory).find((e) => e.id === req.params.id)
    }

    if (!entityToDelete) {
      return res.status(404).json({ error: `Record not found in ${entity}` })
    }
    
    // For characters, check ownership unless user is admin
    if (entity === 'characters' && req.user && req.user.role !== USER_ROLE.ADMIN) {
      if (entityToDelete.ownerId !== req.user.uid) {
        return res.status(403).json({ error: 'You can only delete your own characters' })
      }
    }

    if (entity === 'characters') {
      deleteCharacterById(entityToDelete.id)
    } else if (entity === 'concepts') {
      deleteConceptById(entityToDelete.id)
    } else {
      deleteFile(entityToDelete.name, directory)
    }
    res.status(200).json({ message: `Record deleted successfully in ${entity}` })
  } catch (error) {
    console.error(`Error deleting record in ${entity}:`, error)
    res.status(500).json({ error: `Failed to delete record in ${entity}` })
  }
}

const transferCharacterOwnership = (req, res) => {
  try {
    const rawId = req.params.id
    // Character ids may be numeric; coerce to match how they are stored in JSON
    const id = isNaN(Number(rawId)) ? rawId : Number(rawId)
    const { newOwnerId } = req.body

    if (!newOwnerId) {
      return res.status(400).json({ error: 'newOwnerId is required' })
    }

    const record = getCharacterRecordById(id)
    if (!record?.character) {
      return res.status(404).json({ error: 'Character not found' })
    }

    if (req.user.role !== USER_ROLE.ADMIN && record.character.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only transfer ownership of your own characters' })
    }

    if (record.character.ownerId === newOwnerId) {
      return res.status(400).json({ error: 'Character is already owned by this user' })
    }

    const updatedCharacter = {
      ...record.character,
      ownerId: newOwnerId,
      updatedAt: new Date().toISOString(),
    }

    saveCharacterFile(updatedCharacter, {
      oldName: record.character.name,
      existingId: record.character.id,
      existingDirectory: record.directory,
    })

    res.status(200).json(updatedCharacter)
  } catch (error) {
    console.error('Error transferring character ownership:', error)
    res.status(500).json({ error: 'Failed to transfer character ownership' })
  }
}

const transferEquipment = (req, res) => {
  try {
    const rawId = req.params.id
    const sourceId = isNaN(Number(rawId)) ? rawId : Number(rawId)
    const { equipmentId, recipientCharacterId, quantity } = req.body

    if (!equipmentId || !recipientCharacterId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'equipmentId, recipientCharacterId, and quantity are required' })
    }

    // Load source character
    const sourceRecord = getCharacterRecordById(sourceId)
    if (!sourceRecord?.character) {
      return res.status(404).json({ error: 'Source character not found' })
    }

    const source = sourceRecord.character

    // Check that user can edit source: must own it, or it's a non-playerCharacter in a shared campaign
    const userCampaignIds = getUserCampaignIds(req.user.uid)
    const canEditSource =
      req.user.role === USER_ROLE.ADMIN ||
      source.ownerId === req.user.uid ||
      (source.campaignId && userCampaignIds.includes(source.campaignId) && source.characterType !== 'playerCharacter')

    if (!canEditSource) {
      return res.status(403).json({ error: 'You do not have permission to transfer equipment from this character' })
    }

    // Find the equipment entry on the source character
    const sourceEquipment = source.equipment || []
    const sourceEntryIndex = sourceEquipment.findIndex((e) => e.id === equipmentId)
    if (sourceEntryIndex === -1) {
      return res.status(404).json({ error: 'Equipment not found on source character' })
    }

    const sourceEntry = sourceEquipment[sourceEntryIndex]
    const sourceQuantity = sourceEntry.quantity ?? 1

    if (quantity > sourceQuantity) {
      return res.status(400).json({ error: 'Transfer quantity exceeds available quantity' })
    }

    // Load recipient character
    const recipientRecord = getCharacterRecordById(recipientCharacterId)
    if (!recipientRecord?.character) {
      return res.status(404).json({ error: 'Recipient character not found' })
    }

    const recipient = recipientRecord.character

    // Check that recipient is accessible: user owns it or it's in a shared campaign
    const canAccessRecipient =
      req.user.role === USER_ROLE.ADMIN ||
      recipient.ownerId === req.user.uid ||
      (recipient.campaignId && userCampaignIds.includes(recipient.campaignId))

    if (!canAccessRecipient) {
      return res.status(403).json({ error: 'You do not have permission to transfer equipment to this character' })
    }

    // Build updated source equipment list
    let updatedSourceEquipment
    if (quantity >= sourceQuantity) {
      // Full transfer — remove the entry entirely
      updatedSourceEquipment = sourceEquipment.filter((_, i) => i !== sourceEntryIndex)
    } else {
      // Partial transfer — reduce quantity
      updatedSourceEquipment = sourceEquipment.map((e, i) =>
        i === sourceEntryIndex ? { ...e, quantity: sourceQuantity - quantity } : e
      )
    }

    // Build updated recipient equipment list — merge with existing entry if present
    const recipientEquipment = recipient.equipment || []
    const existingRecipientIndex = recipientEquipment.findIndex((e) => e.id === equipmentId)
    let updatedRecipientEquipment
    if (existingRecipientIndex !== -1) {
      const existingQty = recipientEquipment[existingRecipientIndex].quantity ?? 1
      updatedRecipientEquipment = recipientEquipment.map((e, i) =>
        i === existingRecipientIndex ? { ...e, quantity: existingQty + quantity } : e
      )
    } else {
      // Add as a new entry, copying UI fields from the source entry
      const newEntry = {
        ...sourceEntry,
        quantity,
        isCarried: true,
      }
      updatedRecipientEquipment = [...recipientEquipment, newEntry]
    }

    const now = new Date().toISOString()

    const updatedSource = { ...source, equipment: updatedSourceEquipment, lastModified: now }
    const updatedRecipient = { ...recipient, equipment: updatedRecipientEquipment, lastModified: now }

    saveCharacterFile(updatedSource, {
      oldName: source.name,
      existingId: source.id,
      existingDirectory: sourceRecord.directory,
    })

    saveCharacterFile(updatedRecipient, {
      oldName: recipient.name,
      existingId: recipient.id,
      existingDirectory: recipientRecord.directory,
    })

    res.status(200).json({ source: updatedSource, recipient: updatedRecipient })
  } catch (error) {
    console.error('Error transferring equipment:', error)
    res.status(500).json({ error: 'Failed to transfer equipment' })
  }
}

export {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  transferCharacterOwnership,
  transferEquipment,
}
