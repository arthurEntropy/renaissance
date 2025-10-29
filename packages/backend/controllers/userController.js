import {
  getDirectory,
  getAllDataByDirectory,
  saveFile,
} from '../utils/fileService.js'
import { getAuth } from '../config/firebase.js'
import { isEmailAllowed } from '../utils/inviteService.js'

const USERS_DIRECTORY = getDirectory('users')

// Get user profile by Firebase UID
export const getUserProfile = async (uid) => {
  try {
    const users = getAllDataByDirectory(USERS_DIRECTORY)
    return users.find(user => user.id === uid && !user.isDeleted)
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Create or update user profile
export const syncUserProfile = async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, username } = req.body
    
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required' })
    }
    
    let userProfile = await getUserProfile(uid)
    
    if (userProfile) {
      // Update existing profile
      userProfile = {
        ...userProfile,
        email,
        // Only update username if provided and user doesn't have one yet
        name: username || userProfile.name,
        photoURL: photoURL || userProfile.photoURL,
        lastLoginAt: new Date().toISOString(),
      }
      
      // Always sync custom claims for existing users too
      const auth = getAuth()
      if (auth) {
        await auth.setCustomUserClaims(uid, { 
          role: userProfile.role,
          status: userProfile.status 
        })
      }
    } else {
      // New user - check if email is in allowed list
      const emailAllowed = await isEmailAllowed(email)
      
      if (!emailAllowed) {
        return res.status(403).json({ 
          error: 'This email address is not invited. Please contact an administrator for access.' 
        })
      }
      
      // Create new profile - automatically approved for invited users
      userProfile = {
        id: uid,
        email,
        // Use provided username, fallback to displayName or email prefix
        name: username || displayName || email.split('@')[0],
        photoURL: photoURL || '',
        role: 'user', // Default role
        status: 'approved', // Auto-approve invited users
        needsUsername: !username, // Flag if user needs to set a username
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isDeleted: false,
        preferences: {
          theme: 'dark',
          notifications: true,
        },
        characters: [], // Character IDs owned by this user
      }
    }
    
    // Save to file system
    saveFile(userProfile, USERS_DIRECTORY)
    
    // Set custom claims in Firebase if role changed
    const auth = getAuth()
    if (auth) {
      await auth.setCustomUserClaims(uid, { 
        role: userProfile.role,
        status: userProfile.status 
      })
    }
    
    res.json(userProfile)
  } catch (error) {
    console.error('Error syncing user profile:', error)
    res.status(500).json({ error: 'Failed to sync user profile' })
  }
}

// Get current user's profile
export const getCurrentUserProfile = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req.user.uid)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    res.json(userProfile)
  } catch (error) {
    console.error('Error getting current user profile:', error)
    res.status(500).json({ error: 'Failed to get user profile' })
  }
}

// Update current user's profile
export const updateCurrentUserProfile = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req.user.uid)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Only allow updating certain fields
    const allowedUpdates = ['name', 'preferences']
    const updates = {}
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }
    
    // If setting username, clear the needsUsername flag
    if (updates.name) {
      updates.needsUsername = false
    }
    
    const updatedProfile = {
      ...userProfile,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
    }
    
    // Need to handle potential filename change if username changed
    const oldName = userProfile.name
    saveFile(updatedProfile, USERS_DIRECTORY, oldName)
    res.json(updatedProfile)
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Failed to update user profile' })
  }
}

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = getAllDataByDirectory(USERS_DIRECTORY)
    const filteredUsers = users.filter(user => !user.isDeleted)
    res.json(filteredUsers)
  } catch (error) {
    console.error('Error getting all users:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
}

// Admin: Update user (approve, change role, etc.)
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const updates = req.body
    
    const userProfile = await getUserProfile(userId)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Admin can update role, status, etc.
    const allowedAdminUpdates = ['role', 'status', 'name']
    const adminUpdates = {}
    
    for (const field of allowedAdminUpdates) {
      if (updates[field] !== undefined) {
        adminUpdates[field] = updates[field]
      }
    }
    
    const updatedProfile = {
      ...userProfile,
      ...adminUpdates,
      lastUpdatedAt: new Date().toISOString(),
    }
    
    saveFile(updatedProfile, USERS_DIRECTORY)
    
    // Update Firebase custom claims
    const auth = getAuth()
    if (auth) {
      await auth.setCustomUserClaims(userId, { 
        role: updatedProfile.role,
        status: updatedProfile.status 
      })
    }
    
    res.json(updatedProfile)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params
    
    const userProfile = await getUserProfile(userId)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Soft delete
    const deletedProfile = {
      ...userProfile,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    }
    
    saveFile(deletedProfile, USERS_DIRECTORY)
    
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

export {
  getUserProfile as getUserProfileById
}