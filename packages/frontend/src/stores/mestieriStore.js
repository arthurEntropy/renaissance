import { defineStore } from 'pinia'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import MestiereService from '@/services/entities/gameConcepts/mestiereService'

export const useMestieriStore = defineStore('mestieri', () => {
  const { items: mestieri, fetch, getById } = useBaseEntityStore(
    MestiereService,
    'mestieri'
  )

  return {
    mestieri,
    fetch,
    getById,
  }
})
