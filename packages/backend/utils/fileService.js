import {
  readdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  existsSync,
} from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Base directory for all data entities (cultures, characters, etc.)
const DATA_DIR = resolve(process.cwd(), '../../data')

const sanitizeFilename = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
}

const getDirectory = (entity) => join(DATA_DIR, entity)

const getEntityNames = () => {
  try {
    return readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((directoryEntry) => directoryEntry.isDirectory())
      .map((directoryEntry) => directoryEntry.name)
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

    let baseFilename = sanitizeFilename(data.name)
    let filename = baseFilename + '.json'
    let filePath = join(directory, filename)

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
        break // Same id, safe to overwrite
      }
    }

    // If old name exists and differs, handle renaming with conflict resolution
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
      }
    }

    // Atomic write using temporary file
    const tempPath = join(directory, `.${filename}.tmp-${uuidv4()}`)
    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
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

export {
  sanitizeFilename,
  getDirectory,
  getEntityNames,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
}
