import { defineStore } from 'pinia'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import WorldElementService from '@/services/entities/gameConcepts/worldElementService'

export const useWorldElementsStore = defineStore('worldElements', () => {
  const { items: worldElements, fetch, getById } = useBaseEntityStore(
    WorldElementService,
    'world elements'
  )

  return {
    worldElements,
    fetch,
    getById,
  }
})
