const {
  getDirectory,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
} = require('../utils/fileService.js')

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
        message: `${entity.slice(0, -1)} created successfully.`,
        id: newEntity.id,
      })
  } catch (error) {
    console.error(`Error creating ${entity.slice(0, -1)}:`, error)
    res.status(500).send(`Failed to create ${entity.slice(0, -1)}.`)
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
        .send(`${entity.slice(0, -1)} updated successfully.`)
    } else {
      return res.status(404).send(`No ${entity.slice(0, -1)} found to update.`)
    }
  } catch (error) {
    console.error(`Error updating ${entity.slice(0, -1)}:`, error)
    res.status(500).send(`Failed to update ${entity.slice(0, -1)}.`)
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
        .send(`${entity.slice(0, -1)} deleted successfully.`)
    } else {
      return res.status(404).send(`${entity.slice(0, -1)} not found.`)
    }
  } catch (error) {
    console.error(`Error deleting ${entity.slice(0, -1)}:`, error)
    res.status(500).send(`Failed to delete ${entity.slice(0, -1)}.`)
  }
}

module.exports = {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
}
