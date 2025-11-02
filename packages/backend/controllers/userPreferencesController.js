import {
  getDirectory,
  getAllDataByDirectory,
  saveFile,
} from '../utils/fileService.js'

// Get current user's preferences
const getUserPreferences = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const directory = getDirectory('userPreferences')
    const allPreferences = getAllDataByDirectory(directory)
    const userPrefs = allPreferences.find(
      (prefs) => prefs.userId === req.user.uid && !prefs.isDeleted
    )

    if (!userPrefs) {
      // Return default preferences
      return res.json({
        userId: req.user.uid,
        backgroundImageId: null,
      })
    }

    res.json(userPrefs)
  } catch (err) {
    console.error('Error reading user preferences:', err)
    res.status(500).json({ error: 'Error reading user preferences' })
  }
}

// Update current user's preferences
const updateUserPreferences = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const directory = getDirectory('userPreferences')
    const allPreferences = getAllDataByDirectory(directory)
    const existingPrefs = allPreferences.find(
      (prefs) => prefs.userId === req.user.uid && !prefs.isDeleted
    )

    let preferencesToSave = {
      ...req.body,
      userId: req.user.uid, // Always use authenticated user's ID
      id: existingPrefs?.id || req.user.uid, // Use existing ID or user ID
      isDeleted: false,
    }

    saveFile(preferencesToSave, directory)
    res.status(200).json(preferencesToSave)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    res.status(500).json({ error: 'Failed to update user preferences' })
  }
}

export { getUserPreferences, updateUserPreferences }
