import { defineStore } from 'pinia'
import { ref } from 'vue'
import MestieriService from '@/services/mestiereService.js'

export const useMestieriStore = defineStore('mestieri', () => {
  // state
  const mestieri = ref([])

  // actions
  const fetch = async () => {
    try {
      mestieri.value = await MestieriService.getAll()
    } catch (error) {
      console.error('Error fetching mestieri:', error)
    }
  }

  // getters
  const getById = (id) => {
    return mestieri.value.find(mestiere => mestiere.id === id)
  }

  return {
    mestieri,
    fetch,
    getById,
  }
})
