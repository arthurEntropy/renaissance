const { readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } = require('fs');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

// Base directory for all entities
const DATA_DIR = join(process.cwd(), 'data');

// Centralized filename sanitization
const sanitizeFilename = (name) => {
  return name.trim().toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')  // Replace special characters with underscores
    .replace(/_+/g, '_'); // Remove multiple consecutive underscores
};

// Get the directory for a given entity
const getDirectory = (entity) => join(DATA_DIR, entity);

// Get all entity names (folder names) from the "data" directory
const getEntityNames = () => {
  try {
    return readdirSync(DATA_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory()) // Only include directories
      .map(dirent => dirent.name); // Get the folder names
  } catch (err) {
    console.error("Error reading entity names from data directory:", err);
    throw new Error("Failed to retrieve entity names.");
  }
};

// Get all data from a specific directory
const getAllDataByDirectory = (directory) => {
  try {
    const files = readdirSync(directory);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = join(directory, file);
        return JSON.parse(readFileSync(filePath, 'utf8'));
      });
  } catch (err) {
    console.error(`Error reading directory: ${directory}`, err);
    throw new Error(`Error reading directory: ${directory}`);
  }
};

// Save a file with sanitized name and generate ID if needed
function saveFile(entity, directory, fileName) {
  try {
    // Ensure all string properties are properly initialized
    if (entity.title) {
      entity.title = entity.title.trim();
    } else {
      entity.title = "Untitled"; // Default title if missing
    }

    if (entity.content) {
      entity.content = entity.content.trim();
    } else {
      entity.content = ""; // Default content if missing
    }

    // Generate a unique ID if not provided
    if (!entity.id) {
      entity.id = uuidv4(); // Generate a UUID
    }

    // Generate file path
    const sanitizedFileName = fileName || `${sanitizeFilename(entity.id)}.json`;
    const filePath = join(directory, sanitizedFileName);

    // Write the file
    writeFileSync(filePath, JSON.stringify(entity, null, 2));
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error(`Error saving file: ${error.message}`);
  }
};

// Delete a file by entity name
const deleteFile = (name, directory) => {
  try {
    const filename = sanitizeFilename(name) + ".json";
    const filePath = join(directory, filename);
    unlinkSync(filePath);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

module.exports = {
  sanitizeFilename,
  getDirectory,
  getEntityNames,
  getAllDataByDirectory,
  saveFile,
  deleteFile,
};