import { defineStore } from 'pinia'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import CultureService from '@/services/entities/gameConcepts/cultureService'

export const useCulturesStore = defineStore('cultures', () => {
  const { items: cultures, fetch, getById } = useBaseEntityStore(
    CultureService,
    'cultures'
  )

  return {
    cultures,
    fetch,
    getById,
  }
})
