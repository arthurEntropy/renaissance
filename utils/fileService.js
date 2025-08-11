const {
  readdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  existsSync,
} = require('fs')
const { join } = require('path')
const { v4: uuidv4 } = require('uuid')

// Base directory for all data entities (cultures, characters, etc.)
const DATA_DIR = join(process.cwd(), 'data')

const sanitizeFilename = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_') // Replace special characters with underscores
    .replace(/_+/g, '_') // Remove multiple consecutive underscores
}

const getDirectory = (entity) => join(DATA_DIR, entity)

const getEntityNames = () => {
  try {
    return readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory()) // Only include directories
      .map((dirent) => dirent.name) // Get the folder names
  } catch (err) {
    console.error('Error reading entity names from data directory:', err)
    throw new Error('Failed to retrieve entity names.')
  }
}

const getAllDataByDirectory = (directory) => {
  try {
    const files = readdirSync(directory)
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = join(directory, file)
        return JSON.parse(readFileSync(filePath, 'utf8'))
      })
  } catch (err) {
    console.error(`Error reading directory: ${directory}`, err)
    throw new Error(`Error reading directory: ${directory}`)
  }
}

const saveFile = (data, directory, oldName = null) => {
  try {
    // Generate a new ID if one doesn't exist
    if (!data.id) {
      data.id = uuidv4()
    }

    // Sanitize the filename
    let baseFilename = sanitizeFilename(data.name)
    let filename = baseFilename + '.json'
    let filePath = join(directory, filename)

    // Get all files in the directory
    const files = readdirSync(directory).filter((f) => f.endsWith('.json'))

    // Check for filename conflicts (different id, same name)
    let suffix = 1
    while (files.includes(filename)) {
      const existingData = JSON.parse(readFileSync(join(directory, filename), 'utf8'))
      if (existingData.id !== data.id) {
        filename = `${baseFilename}_${suffix}.json`
        filePath = join(directory, filename)
        suffix++
      } else {
        // Same id, safe to overwrite
        break
      }
    }

    // If old name exists and differs, first rename the old file to the new target path
    if (oldName && oldName !== data.name) {
      const oldBaseFilename = sanitizeFilename(oldName)
      const oldFilename = oldBaseFilename + '.json'
      const oldFilePath = join(directory, oldFilename)

      // Handle renaming conflicts (ensure target filename isn't another entity)
      let renameSuffix = 1
      while (files.includes(filename) && oldFilename !== filename) {
        const existingDataAtTarget = JSON.parse(readFileSync(join(directory, filename), 'utf8'))
        if (existingDataAtTarget.id !== data.id) {
          filename = `${baseFilename}_${renameSuffix}.json`
          filePath = join(directory, filename)
          renameSuffix++
        } else {
          break
        }
      }

      // Only attempt rename if the old file actually exists and target differs
      if (existsSync(oldFilePath) && oldFilename !== filename) {
        renameSync(oldFilePath, filePath)
      } else {
        // If names are same or old file missing, continue with writing logic below
      }
    }

    // Atomic write: write to temp file in same dir, then rename into place
    const tempPath = join(
      directory,
      `.${filename}.tmp-${uuidv4()}`
    )

    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
    // Rename is atomic on the same filesystem
    renameSync(tempPath, filePath)
  } catch (error) {
    console.error(`Error saving file: ${error.message}`)
    throw new Error(`Error saving file: ${error.message}`)
  }
}

const deleteFile = (name, directory) => {
  try {
    const filename = sanitizeFilename(name) + '.json'
    const filePath = join(directory, filename)
    unlinkSync(filePath)
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`)
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

module.exports = {
  sanitizeFilename,
  getDirectory,
  getEntityNames,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
}
