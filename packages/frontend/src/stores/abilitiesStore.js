import { defineStore } from 'pinia'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import AbilityService from '@/services/entities/abilityService'

export const useAbilitiesStore = defineStore('abilities', () => {
  const { items: abilities, fetch, getById } = useBaseEntityStore(
    AbilityService,
    'abilities'
  )

  return {
    abilities,
    fetch,
    getById,
  }
})
