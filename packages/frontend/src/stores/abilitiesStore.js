import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import AbilityService from '@/services/entities/abilityService'

export const useAbilitiesStore = defineStore('abilities', () => {
  const base = useCrudEntityStore(AbilityService, 'abilities')

  return {
    abilities: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
  }
})
