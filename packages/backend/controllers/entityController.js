const {
  getDirectory,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
} = require('../utils/fileService.js')

// These are generic CRUD operations for all entities.
// They are designed to be used with the routes defined in server.js.
// The routes are created dynamically based on the entity names in the "data" directory.

const getAllEntities = (entity) => (req, res) => {
  try {
    const directory = getDirectory(entity)
    const allEntities = getAllDataByDirectory(directory)
    const filteredEntities = allEntities.filter((e) => !e.isDeleted) // Filter out deleted entities
    res.json(filteredEntities)
  } catch (err) {
    console.error(`Error reading ${entity} directory:`, err)
    res.status(500).send(`Error reading ${entity} directory.`)
  }
}

const createEntity = (entity) => (req, res) => {
  const newEntity = req.body

  try {
    const directory = getDirectory(entity)
    saveFile(newEntity, directory)
    res
      .status(201)
      .send({
        message: `New record created in ${entity}.`,
        id: newEntity.id,
      })
  } catch (error) {
    console.error(`Error creating new record in ${entity}:`, error)
    res.status(500).send(`Error creating new record in ${entity}.`)
  }
}

const updateEntity = (entity) => (req, res) => {
  try {
    const updatedEntity = req.body
    const directory = getDirectory(entity)
    const entities = getAllDataByDirectory(directory)
    const existingEntity = entities.find((e) => e.id === updatedEntity.id)

    if (existingEntity) {
      saveFile(updatedEntity, directory, existingEntity.name)
      return res
        .status(200)
        .send(`Record updated successfully in ${entity}.`)
    } else {
      return res.status(404).send(`No record found to update in ${entity}.`)
    }
  } catch (error) {
    console.error(`Error updating record in ${entity}:`, error)
    res.status(500).send(`Failed to update record in ${entity}.`)
  }
}

const deleteEntity = (entity) => (req, res) => {
  try {
    const entityId = req.params.id
    const directory = getDirectory(entity)
    const entities = getAllDataByDirectory(directory)
    const entityToDelete = entities.find((e) => e.id === entityId)

    if (entityToDelete) {
      deleteFile(entityToDelete.name, directory)
      return res
        .status(200)
        .send(`Record deleted successfully in ${entity}.`)
    } else {
      return res.status(404).send(`Record not found in ${entity}.`)
    }
  } catch (error) {
    console.error(`Error deleting record in ${entity}:`, error)
    res.status(500).send(`Failed to delete record in ${entity}.`)
  }
}

module.exports = {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
}
