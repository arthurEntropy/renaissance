import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '@/services/auth/authService'
import router from '@/router/router'
import { useUserStore } from './userStore'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isLoading = ref(true)
  const error = ref(null)
  const notInvited = ref(false)

  // Getters
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => {
    const userStore = useUserStore()
    return userStore.userProfile?.role === 'admin'
  })
  const isPending = computed(() => {
    const userStore = useUserStore()
    return userStore.userProfile?.status === 'pending'
  })
  const isApproved = computed(() => {
    const userStore = useUserStore()
    return userStore.userProfile?.status === 'approved'
  })

  // Actions
  const signInWithGoogle = async () => {
    try {
      error.value = null
      notInvited.value = false
      isLoading.value = true
      
      const result = await AuthService.signInWithGoogle()
      user.value = result.user
      
      // Fetch user profile from backend via userStore
      const userStore = useUserStore()
      await userStore.fetch()
      
      return result
    } catch (err) {
      error.value = err.message
      
      // If not invited, sign out the user and set flag
      if (err.message.includes('not invited')) {
        notInvited.value = true
        await AuthService.signOut()
        user.value = null
        const userStore = useUserStore()
        userStore.userProfile = null
      }
      
      throw err
    } finally {
      isLoading.value = false
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
      
      // Clear user profile
      const userStore = useUserStore()
      userStore.userProfile = null
      
      // Redirect to title page
      router.push('/')
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const checkAuthStatus = async () => {
    try {
      isLoading.value = true
      const currentUser = await AuthService.waitForAuth()
      user.value = currentUser
      
      if (currentUser) {
        const userStore = useUserStore()
        await userStore.fetch()
      }
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuthListener = () => {
    AuthService.onAuthStateChange(async (firebaseUser) => {
      user.value = firebaseUser
      
      try {
        if (firebaseUser) {
          const userStore = useUserStore()
          await userStore.fetch()
        } else {
          const userStore = useUserStore()
          userStore.userProfile = null
        }
      } catch (err) {
        console.error('Error in auth state listener:', err)
        error.value = err.message
      } finally {
        isLoading.value = false
      }
    })
  }

  return {
    // State
    user,
    isLoading,
    error,
    notInvited,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isPending,
    isApproved,
    
    // Actions
    signInWithGoogle,
    signOut,
    checkAuthStatus,
    initializeAuth: initializeAuthListener,
    clearNotInvited
  }
})