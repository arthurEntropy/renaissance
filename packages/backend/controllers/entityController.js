import {
  getDirectory,
  getAllDataByDirectory,
  getAllCharacterData,
  getCharacterRecordById,
  saveCharacterFile,
  deleteCharacterById,
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
      : getAllDataByDirectory(getDirectory(entity))
    let filteredEntities = allEntities.filter((e) => !e.isDeleted)
    
    // For characters, filter by ownership unless user is admin
    if (entity === 'characters' && req.user) {
      if (req.user.role !== USER_ROLE.ADMIN) {
        // Include characters owned by this user AND campaign characters from campaigns they belong to
        const memberCampaignIds = getUserCampaignIds(req.user.uid)
        filteredEntities = filteredEntities.filter(character =>
          character.ownerId === req.user.uid ||
          (character.campaignId && memberCampaignIds.includes(character.campaignId))
        )
      }
    }
    
    // For concepts, filter by conceptType if query parameter provided
    if (entity === 'concepts' && req.query.conceptType) {
      const requestedTypes = req.query.conceptType.split(',').map(t => t.trim())
      filteredEntities = filteredEntities.filter(concept =>
        requestedTypes.includes(concept.conceptType)
      )
    }
    
    res.json(filteredEntities)
  } catch (err) {
    console.error(`Error reading ${entity} directory:`, err)
    res.status(500).json({ error: `Error reading ${entity} directory` })
  }
}

const createEntity = (entity) => (req, res) => {
  try {
    const directory = entity === 'characters' ? null : getDirectory(entity)

    // For characters, add owner information
    if (entity === 'characters' && req.user) {
      req.body.ownerId = req.user.uid
      req.body.createdAt = new Date().toISOString()
    }

    if (entity === 'characters') {
      saveCharacterFile(req.body)
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
    const directory = entity === 'characters' ? null : getDirectory(entity)
    const existingEntity = entity === 'characters'
      ? getCharacterRecordById(req.body.id)
      : { character: getAllDataByDirectory(directory).find((e) => e.id === req.body.id), directory }

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
    const directory = entity === 'characters' ? null : getDirectory(entity)
    const entityToDelete = entity === 'characters'
      ? getCharacterRecordById(req.params.id)?.character
      : getAllDataByDirectory(directory).find((e) => e.id === req.params.id)

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
    } else {
      deleteFile(entityToDelete.name, directory)
    }
    res.status(200).json({ message: `Record deleted successfully in ${entity}` })
  } catch (error) {
    console.error(`Error deleting record in ${entity}:`, error)
    res.status(500).json({ error: `Failed to delete record in ${entity}` })
  }
}

export {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
}
