import { getAuth } from '../config/firebase.js'

// Middleware to verify Firebase ID token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }
    
    const token = authHeader.split('Bearer ')[1]
    
    const auth = getAuth()
    if (!auth) {
      console.error('Firebase Admin not initialized')
      return res.status(500).json({ error: 'Authentication service unavailable' })
    }
    
    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token)
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      role: decodedToken.role || 'user',
      ...decodedToken
    }
    
    next()
  } catch (error) {
    console.error('Token verification error:', error.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Middleware to require authentication
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

// Middleware to require admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  next()
}

// Middleware to require approved user status
export const requireApproved = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  try {
    // Check user status in local database
    const { getUserProfile } = await import('../controllers/userController.js')
    const userProfile = await getUserProfile(req.user.uid)
    
    if (!userProfile) {
      return res.status(403).json({ error: 'User profile not found' })
    }
    
    if (userProfile.status !== 'approved' && userProfile.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        status: userProfile.status 
      })
    }
    
    // Add user profile to request
    req.userProfile = userProfile
    next()
  } catch (error) {
    console.error('Error checking user approval status:', error)
    res.status(500).json({ error: 'Error verifying user status' })
  }
}

// Middleware to check resource ownership
export const requireOwnership = (resourceParam = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next()
    }
    
    try {
      const resourceId = req.params[resourceParam]
      
      // Check if user owns the resource
      const isOwner = await checkResourceOwnership(req.user.uid, resourceId, req.baseUrl)
      
      if (!isOwner) {
        return res.status(403).json({ error: 'Access denied: resource not owned by user' })
      }
      
      next()
    } catch (error) {
      console.error('Error checking resource ownership:', error)
      res.status(500).json({ error: 'Error verifying resource ownership' })
    }
  }
}

// Helper function to check resource ownership
async function checkResourceOwnership(userId, resourceId, endpoint) {
  try {
    // Only checking 'characters' ownership for now
    if (endpoint.includes('/characters')) {
      const { getAllDataByDirectory, getDirectory } = await import('../utils/fileService.js')
      const directory = getDirectory('characters')
      const characters = getAllDataByDirectory(directory)
      const character = characters.find(c => c.id === resourceId)
      return character && character.ownerId === userId
    }
    
    // For now, defaulting to false for unknown types
    return false
  } catch (error) {
    console.error('Error in checkResourceOwnership:', error)
    return false
  }
}

export default {
  verifyToken,
  requireAuth,
  requireAdmin,
  requireApproved,
  requireOwnership
}