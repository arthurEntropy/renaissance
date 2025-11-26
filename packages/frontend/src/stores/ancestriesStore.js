import { defineStore } from 'pinia'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import AncestryService from '@/services/entities/gameConcepts/ancestryService'

export const useAncestriesStore = defineStore('ancestries', () => {
  const { items: ancestries, fetch, getById } = useBaseEntityStore(
    AncestryService,
    'ancestries'
  )

  return {
    ancestries,
    fetch,
    getById,
  }
})
