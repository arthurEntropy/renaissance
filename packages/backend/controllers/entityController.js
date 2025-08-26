import {
  getDirectory,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
} from '../utils/fileService.js'

// These are generic CRUD operations for all entities.
// They are designed to be used with the routes defined in server.js.
// The routes are created dynamically based on the entity names in the "data" directory.

const getAllEntities = (entity) => (req, res) => {
  try {
    const directory = getDirectory(entity)
    const allEntities = getAllDataByDirectory(directory)
    const filteredEntities = allEntities.filter((e) => !e.isDeleted)
    res.json(filteredEntities)
  } catch (err) {
    console.error(`Error reading ${entity} directory:`, err)
    res.status(500).json({ error: `Error reading ${entity} directory` })
  }
}

const createEntity = (entity) => (req, res) => {
  try {
    const directory = getDirectory(entity)
    saveFile(req.body, directory)
    res.status(201).json({
      message: `New record created in ${entity}`,
      id: req.body.id,
    })
  } catch (error) {
    console.error(`Error creating new record in ${entity}:`, error)
    res.status(500).json({ error: `Error creating new record in ${entity}` })
  }
}

const updateEntity = (entity) => (req, res) => {
  try {
    const directory = getDirectory(entity)
    const entities = getAllDataByDirectory(directory)
    const existingEntity = entities.find((e) => e.id === req.body.id)

    if (!existingEntity) {
      return res.status(404).json({ error: `No record found to update in ${entity}` })
    }

    saveFile(req.body, directory, existingEntity.name)
    res.status(200).json({ message: `Record updated successfully in ${entity}` })
  } catch (error) {
    console.error(`Error updating record in ${entity}:`, error)
    res.status(500).json({ error: `Failed to update record in ${entity}` })
  }
}

const deleteEntity = (entity) => (req, res) => {
  try {
    const directory = getDirectory(entity)
    const entities = getAllDataByDirectory(directory)
    const entityToDelete = entities.find((e) => e.id === req.params.id)

    if (!entityToDelete) {
      return res.status(404).json({ error: `Record not found in ${entity}` })
    }

    deleteFile(entityToDelete.name, directory)
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
