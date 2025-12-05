import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'

export const useEngagementSuccessesStore = defineStore('engagementSuccesses', () => {
  const base = useCrudEntityStore(EngagementSuccessService, 'engagementSuccess')

  return {
    items: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
