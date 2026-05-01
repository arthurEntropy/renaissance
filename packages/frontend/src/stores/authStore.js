import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '@/services/auth/authService'
import router from '@/router/router'
import { useUserStore } from './userStore'
import { useCampaignStore } from './campaignStore'
import { USER_STATUS, USER_ROLE } from '@shared/constants/userConstants'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isLoading = ref(true)
  const error = ref(null)
  const notInvited = ref(false)

  // Getters - derive from user profile in userStore
  const isAuthenticated = computed(() => user.value !== null)
  
  // Role and status checks use the userStore's profile
  const isAdmin = computed(() => {
    const userStore = useUserStore()
    return userStore.userProfile?.role === USER_ROLE.ADMIN
  })

  const isPending = computed(() => {
    const userStore = useUserStore()
    return userStore.userProfile?.status === USER_STATUS.PENDING
  })

  const isApproved = computed(() => {
    const userStore = useUserStore()
    return userStore.userProfile?.status === USER_STATUS.APPROVED
  })

  const syncAuthScopedData = async (firebaseUser) => {
    user.value = firebaseUser

    const userStore = useUserStore()
    const campaignStore = useCampaignStore()

    if (!firebaseUser) {
      userStore.userProfile = null
      campaignStore.reset()
      return
    }

    await userStore.fetch()
    await campaignStore.fetch()
  }

  // Actions
  const signInWithGoogle = async () => {
    try {
      error.value = null
      notInvited.value = false
      isLoading.value = true
      
      const result = await AuthService.signInWithGoogle()
            await syncAuthScopedData(result.user)
      
      return result
    } catch (err) {
      error.value = err.message
      
      // If not invited, sign out the user and set flag
      if (err.message.includes('not invited')) {
        notInvited.value = true
        await AuthService.signOut()
        await syncAuthScopedData(null)
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
      await syncAuthScopedData(null)
      
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
      await syncAuthScopedData(currentUser)
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuthListener = () => {
    AuthService.onAuthStateChange(async (firebaseUser) => {
      try {
        await syncAuthScopedData(firebaseUser)
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