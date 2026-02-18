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
import { v4 as uuidv4 } from 'uuid'

// Base directory for all data entities (cultures, characters, etc.)
const DATA_DIR = fileURLToPath(new URL('../../../data', import.meta.url))

const sanitizeFilename = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
}

const ensureImprovementIds = (abilityData) => {
  if (abilityData.improvements && Array.isArray(abilityData.improvements)) {
    abilityData.improvements.forEach((improvement) => {
      if (!improvement.id) {
        improvement.id = uuidv4()
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

const saveFile = (data, directory, oldName = null, existingId = null) => {
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

    // Special handling for abilities and equipment: ensure improvements have IDs
    if (directory.endsWith('abilities') || directory.endsWith('equipment')) {
      data = ensureImprovementIds(data)
    }

    // For entities without names (like art), use ID as filename
    const useName = data.name !== undefined && data.name !== null
    let baseFilename = useName ? sanitizeFilename(data.name) : data.id
    let filename = baseFilename + '.json'
    let filePath = join(directory, filename)

    const files = readdirSync(directory).filter((f) => f.endsWith('.json'))

    // If updating an existing entity, find and remove the old file first
    let oldFilePath = null
    let oldFileName = null
    if (!isNew && existingId) {
      // Find the existing file by ID
      const matchingFiles = []
      for (const file of files) {
        const existingFilePath = join(directory, file)
        try {
          const existingData = JSON.parse(readFileSync(existingFilePath, 'utf8'))
          if (existingData.id === existingId) {
            matchingFiles.push({ file, path: existingFilePath, name: existingData.name })
          }
        } catch (err) {
          // Skip files that can't be parsed
          console.warn(`Could not parse file ${file}:`, err.message)
        }
      }
      
      // Warn if multiple files have the same ID (data corruption)
      if (matchingFiles.length > 1) {
        console.error(`WARNING: Found ${matchingFiles.length} files with ID ${existingId}:`)
        matchingFiles.forEach(f => console.error(`  - ${f.file} (name: "${f.name}")`))
      }
      
      // Use the first matching file, or if oldName provided, prefer file with matching name
      if (matchingFiles.length > 0) {
        let targetFile = matchingFiles[0]
        if (oldName) {
          const nameMatch = matchingFiles.find(f => f.name === oldName)
          if (nameMatch) {
            targetFile = nameMatch
          }
        }
        oldFilePath = targetFile.path
        oldFileName = targetFile.name
      }
    }

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
    if (oldName && oldName !== data.name && useName && oldFilePath) {
      // We have an old file to rename
      // Handle renaming conflicts (ensure target filename isn't another entity)
      let renameSuffix = 1
      while (files.includes(filename)) {
        const existingDataAtTarget = JSON.parse(readFileSync(join(directory, filename), 'utf8'))
        if (existingDataAtTarget.id !== data.id) {
          filename = `${baseFilename}_${renameSuffix}.json`
          filePath = join(directory, filename)
          renameSuffix++
        } else {
          break
        }
      }
    }

    // Atomic write using temporary file
    const tempPath = join(directory, `.${filename}.tmp-${uuidv4()}`)
    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
    renameSync(tempPath, filePath)

    // Remove the old file if it exists and is different from the new file
    if (oldFilePath && oldFilePath !== filePath && existsSync(oldFilePath)) {
      // Additional safety: verify the file still has the same ID before deleting
      try {
        const fileToDelete = JSON.parse(readFileSync(oldFilePath, 'utf8'))
        if (fileToDelete.id === data.id) {
          console.log(`Removing old file: ${oldFilePath} (replacing with ${filePath})`)
          unlinkSync(oldFilePath)
        } else {
          console.error(`SAFETY CHECK FAILED: File ${oldFilePath} has ID ${fileToDelete.id}, expected ${data.id}. Not deleting.`)
        }
      } catch (err) {
        console.error(`Error verifying file before deletion: ${err.message}`)
      }
    }
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

const deleteFileById = (id, directory) => {
  try {
    const files = readdirSync(directory).filter((file) => file.endsWith('.json'))
    let targetPath = null

    for (const file of files) {
      const filePath = join(directory, file)
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        if (data?.id === id) {
          targetPath = filePath
          break
        }
      } catch (err) {
        console.warn(`Could not parse file ${file}:`, err.message)
      }
    }

    if (!targetPath) {
      throw new Error(`No file found with id ${id}`)
    }

    unlinkSync(targetPath)
  } catch (error) {
    console.error(`Error deleting file by id: ${error.message}`)
    throw new Error(`Error deleting file by id: ${error.message}`)
  }
}

export {
  sanitizeFilename,
  getDirectory,
  getEntityNames,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
  deleteFileById,
}
