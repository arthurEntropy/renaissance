import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import MestieriService from '@/services/MestiereService.js'

export const useMestieriStore = defineStore('mestieri', () => {
  const state = reactive({
    mestieri: [],
    selectedMestiere: null,
  })

  const fetchMestieri = async () => {
    try {
      state.mestieri = await MestieriService.getAllMestieri()
    } catch (error) {
      console.error('Failed to fetch mestieri:', error)
    }
  }

  const setSelectedMestiere = (mestiere) => {
    state.selectedMestiere = mestiere
  }

  const clearSelectedMestiere = () => {
    state.selectedMestiere = null
  }

  return {
    ...toRefs(state),
    fetchMestieri,
    setSelectedMestiere,
    clearSelectedMestiere,
  }
})
