import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import AbilitySchoolService from '@/services/entities/abilitySchoolService'

export const useAbilitySchoolsStore = defineStore('abilitySchools', () => {
  const base = useCrudEntityStore(AbilitySchoolService, 'abilitySchool')

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
