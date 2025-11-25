import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '@/services/auth/authService'
import router from '@/router/router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const notInvited = ref(false)

  // Getters
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => userProfile.value?.role === 'admin')
  const isPending = computed(() => userProfile.value?.status === 'pending')
  const isApproved = computed(() => userProfile.value?.status === 'approved')
  const needsUsername = computed(() => userProfile.value?.needsUsername === true)
  const displayName = computed(() => userProfile.value?.name || user.value?.displayName || user.value?.email || 'User')

  // Actions
  const signInWithGoogle = async () => {
    try {
      error.value = null
      notInvited.value = false
      loading.value = true
      
      const result = await AuthService.signInWithGoogle()
      user.value = result.user
      
      // Fetch user profile from backend
      await fetchUserProfile()
      
      return result
    } catch (err) {
      error.value = err.message
      
      // If not invited, sign out the user and set flag
      if (err.message.includes('not invited')) {
        notInvited.value = true
        await AuthService.signOut()
        user.value = null
        userProfile.value = null
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearNotInvited = () => {
    notInvited.value = false
    error.value = null
  }

  const signOut = async () => {
    try {
      error.value = null
      await AuthService.signOut()
      user.value = null
      userProfile.value = null
      
      // Redirect to title page
      router.push('/')
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const fetchUserProfile = async () => {
    if (!user.value) return
    
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        userProfile.value = await response.json()
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  const updateUserProfile = async (updates) => {
    if (!user.value) return
    
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        userProfile.value = await response.json()
      }
    } catch (err) {
      console.error('Error updating user profile:', err)
      throw err
    }
  }

  const setUsername = async (username) => {
    await updateUserProfile({ name: username })
  }

  const checkAuthStatus = async () => {
    try {
      loading.value = true
      const currentUser = await AuthService.waitForAuth()
      user.value = currentUser
      
      if (currentUser) {
        await fetchUserProfile()
      }
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Initialize auth listener
  const initializeAuth = () => {
    AuthService.onAuthStateChange(async (firebaseUser) => {
      user.value = firebaseUser
      
      if (firebaseUser) {
        await fetchUserProfile()
      } else {
        userProfile.value = null
      }
      
      loading.value = false
    })
  }

  return {
    // State
    user,
    userProfile,
    loading,
    error,
    notInvited,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isPending,
    isApproved,
    needsUsername,
    displayName,
    
    // Actions
    signInWithGoogle,
    signOut,
    fetchUserProfile,
    updateUserProfile,
    setUsername,
    checkAuthStatus,
    initializeAuth,
    clearNotInvited
  }
})