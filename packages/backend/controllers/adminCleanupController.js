import {
  getEntityNames,
  getAllDataByDirectory,
  getDirectory,
  deleteFileById,
} from '../utils/fileService.js'

const EXCLUDED_ENTITIES = new Set(['invites'])

const getItemLabel = (item) => {
  return (
    item?.name ||
    item?.title ||
    item?.imageUrl ||
    item?.url ||
    item?.id ||
    'Unknown'
  )
}

const scanCleanup = (req, res) => {
  try {
    const entities = getEntityNames().filter((entity) => !EXCLUDED_ENTITIES.has(entity))
    const dataByEntity = {}

    for (const entity of entities) {
      const directory = getDirectory(entity)
      dataByEntity[entity] = getAllDataByDirectory(directory)
    }

    const resultsByKey = new Map()

    const addResult = (entity, item, reason) => {
      if (!item?.id) return
      const key = `${entity}:${item.id}`
      if (!resultsByKey.has(key)) {
        resultsByKey.set(key, {
          entity,
          id: item.id,
          label: getItemLabel(item),
          reasons: [],
        })
      }
      const entry = resultsByKey.get(key)
      if (entry && !entry.reasons.includes(reason)) {
        entry.reasons.push(reason)
      }
    }

    for (const entity of entities) {
      const items = dataByEntity[entity] || []
      for (const item of items) {
        if (item?.isDeleted === true) {
          addResult(entity, item, 'isDeleted')
        }
      }
    }

    const equipment = dataByEntity.equipment || []
    const characters = (dataByEntity.characters || []).filter((character) => !character?.isDeleted)
    const assignedEquipmentIds = new Set()

    for (const character of characters) {
      const equipmentItems = Array.isArray(character?.equipment) ? character.equipment : []
      for (const equipmentItem of equipmentItems) {
        if (equipmentItem?.id) {
          assignedEquipmentIds.add(equipmentItem.id)
        }
      }
    }

    for (const item of equipment) {
      if (item?.isCustom && item?.id && !assignedEquipmentIds.has(item.id)) {
        addResult('equipment', item, 'unassignedCustomEquipment')
      }
    }

    res.json({
      items: Array.from(resultsByKey.values()),
    })
  } catch (error) {
    console.error('Error scanning cleanup data:', error)
    res.status(500).json({ error: 'Failed to scan cleanup data' })
  }
}

const deleteCleanupItems = (req, res) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' })
    }

    const entities = new Set(getEntityNames().filter((entity) => !EXCLUDED_ENTITIES.has(entity)))
    const deleted = []
    const errors = []

    for (const item of items) {
      const entity = item?.entity
      const id = item?.id
      if (!entity || !id || !entities.has(entity)) {
        errors.push({ entity, id, error: 'Invalid entity or id' })
        continue
      }

      try {
        const directory = getDirectory(entity)
        deleteFileById(id, directory)
        deleted.push({ entity, id })
      } catch (error) {
        errors.push({ entity, id, error: error.message })
      }
    }

    res.json({
      deletedCount: deleted.length,
      errors,
    })
  } catch (error) {
    console.error('Error deleting cleanup data:', error)
    res.status(500).json({ error: 'Failed to delete cleanup data' })
  }
}

export {
  scanCleanup,
  deleteCleanupItems,
}
