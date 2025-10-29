import { getAuth } from '../config/firebase.js'

// Socket.IO middleware to verify Firebase token
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return next(new Error('Authentication token required'))
    }
    
    const auth = getAuth()
    if (!auth) {
      console.error('Firebase Admin not initialized')
      return next(new Error('Authentication service unavailable'))
    }
    
    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token)
    
    // Add user info to socket object
    socket.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      role: decodedToken.role || 'user',
      ...decodedToken
    }
    
    next()
  } catch (error) {
    console.error('Socket authentication error:', error.message)
    next(new Error('Invalid or expired token'))
  }
}

// Middleware to require approved user for socket connections
export const socketRequireApproved = async (socket, next) => {
  try {
    if (!socket.user) {
      return next(new Error('Authentication required'))
    }
    
    // Import user controller to check status
    const { getUserProfile } = await import('../controllers/userController.js')
    const userProfile = await getUserProfile(socket.user.uid)
    
    if (!userProfile) {
      return next(new Error('User profile not found'))
    }
    
    if (userProfile.status !== 'approved' && userProfile.role !== 'admin') {
      return next(new Error('Account pending approval'))
    }
    
    // Add user profile to socket
    socket.userProfile = userProfile
    next()
  } catch (error) {
    console.error('Error checking user approval status:', error)
    next(new Error('Error verifying user status'))
  }
}

export default {
  socketAuthMiddleware,
  socketRequireApproved
}