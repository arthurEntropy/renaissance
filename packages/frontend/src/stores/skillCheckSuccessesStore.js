import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import SkillCheckSuccessService from '@/services/entities/skillCheckSuccessService'

export const useSkillCheckSuccessesStore = defineStore('skillCheckSuccesses', () => {
  const base = useCrudEntityStore(SkillCheckSuccessService, 'skillCheckSuccess')

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
