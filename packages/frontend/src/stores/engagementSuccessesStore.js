import { defineStore } from 'pinia'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'

export const useEngagementSuccessesStore = defineStore('engagementSuccesses', () => {
  const { items: engagementSuccesses, fetch, getById } = useBaseEntityStore(
    EngagementSuccessService,
    'engagement successes'
  )

  return {
    engagementSuccesses,
    fetch,
    getById,
  }
})
