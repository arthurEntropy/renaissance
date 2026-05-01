import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider } from '@/config/firebase'
import { USER_ROLE } from '@shared/constants/userConstants'

class AuthService {
  constructor() {
    this.currentUser = null
    this.authInitialized = false
    this.listeners = []
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      this.authInitialized = true
      this.notifyListeners(user)
    })
  }

  // Currently only Google sign-in is supported
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      await this.syncUserProfile(user)
      
      return { user }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  async signOut() {
    try {
      await signOut(auth)
      this.currentUser = null
      return true
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return this.currentUser !== null
  }

  async getIdToken() {
    if (!this.currentUser) return null
    try {
      return await this.currentUser.getIdToken()
    } catch (error) {
      console.error('Error getting ID token:', error)
      return null
    }
  }

  async getIdTokenResult() {
    if (!this.currentUser) return null
    try {
      return await this.currentUser.getIdTokenResult()
    } catch (error) {
      console.error('Error getting ID token result:', error)
      return null
    }
  }

  async isAdmin() {
    const tokenResult = await this.getIdTokenResult()
    return tokenResult?.claims?.role === USER_ROLE.ADMIN
  }

  async syncUserProfile(user) {
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          photoURL: user.photoURL
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // If 403, it means the email is not invited
        if (response.status === 403) {
          throw new Error(data.error || 'This email address is not invited')
        }
        throw new Error(data.error || 'Failed to sync user profile')
      }
      
      return data
    } catch (error) {
      console.error('Error syncing user profile:', error)
      throw error
    }
  }

  onAuthStateChange(callback) {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  notifyListeners(user) {
    this.listeners.forEach(callback => {
      try {
        callback(user)
      } catch (error) {
        console.error('Error in auth state listener:', error)
      }
    })
  }

  waitForAuth() {
    return new Promise((resolve) => {
      if (this.authInitialized) {
        resolve(this.currentUser)
        return
      }
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    })
  }
}

export default new AuthService()