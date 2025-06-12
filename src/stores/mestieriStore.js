import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import MestieriService from '@/services/MestiereService.js'

export const useMestieriStore = defineStore('mestieri', () => {
  const state = reactive({
    mestieri: [],
  })

  const fetchMestieri = async () => {
    try {
      state.mestieri = await MestieriService.getAllMestieri()
    } catch (error) {
      console.error('Failed to fetch mestieri:', error)
    }
  }

  return {
    ...toRefs(state),
    fetchMestieri,
  }
})
