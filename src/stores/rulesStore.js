import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import RulesService from '@/services/RulesService.js'

export const useRulesStore = defineStore('rules', () => {
  const state = reactive({
    sections: [],
  })

  const fetchRules = async () => {
    try {
      state.sections = await RulesService.getAllSections()
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  return {
    ...toRefs(state),
    fetchRules,
  }
})
