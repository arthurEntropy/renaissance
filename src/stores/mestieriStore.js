import { defineStore } from 'pinia'
import { ref } from 'vue'
import MestieriService from '@/services/mestiereService.js'

export const useMestieriStore = defineStore('mestieri', () => {
  const mestieri = ref([])

  const fetchMestieri = async () => {
    try {
      mestieri.value = await MestieriService.getAllMestieri()
    } catch (error) {
      console.error('Failed to fetch mestieri:', error)
    }
  }

  return {
    mestieri,
    fetchMestieri,
  }
})
