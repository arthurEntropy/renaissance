import {
  readdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  existsSync,
} from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid'

// Base directory for all data entities (cultures, characters, etc.)
const DATA_DIR = fileURLToPath(new URL('../../../data', import.meta.url))

// Namespace UUID for deterministic improvement ID generation
const IMPROVEMENT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

const sanitizeFilename = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
}

/**
 * Generate a deterministic UUID for an improvement based on ability ID and improvement name
 * This ensures consistency across environments and multiple runs
 */
const generateDeterministicImprovementId = (abilityId, improvementName) => {
  const seed = `${abilityId}-${improvementName.trim().toLowerCase()}`
  return uuidv5(seed, IMPROVEMENT_NAMESPACE)
}

/**
 * Ensure all improvements in an ability have unique IDs
 * This is called automatically when saving ability data
 */
const ensureImprovementIds = (abilityData) => {
  if (abilityData.improvements && Array.isArray(abilityData.improvements)) {
    abilityData.improvements.forEach((improvement) => {
      if (!improvement.id && improvement.name) {
        // Generate deterministic ID based on ability ID and improvement name
        improvement.id = generateDeterministicImprovementId(abilityData.id, improvement.name)
      }
    })
  }
  return abilityData
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
    const isNew = !data.id
    if (isNew) {
      data.id = uuidv4()
    }

    // Handle timestamps
    const now = new Date().toISOString()
    if (isNew && !data.createdAt) {
      data.createdAt = now
    }
    // Always update lastModified
    data.lastModified = now

    // Special handling for abilities: ensure improvements have IDs
    if (directory.endsWith('abilities')) {
      data = ensureImprovementIds(data)
    }

    // For entities without names (like art), use ID as filename
    const useName = data.name !== undefined && data.name !== null
    let baseFilename = useName ? sanitizeFilename(data.name) : data.id
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
    if (oldName && oldName !== data.name && useName) {
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
