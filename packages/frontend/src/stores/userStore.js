import { defineStore } from 'pinia'
import { useSingleEntityStore } from './composables/useSingleEntityStore'
import UserService from '@/services/entities/userService'

export const useUserStore = defineStore('user', () => {
  const { entity: userProfile, isLoading, error, fetch, update } = useSingleEntityStore(
    UserService,
    'user profile'
  )

  return {
    userProfile,
    isLoading,
    error,
    fetch,
    update,
  }
})
