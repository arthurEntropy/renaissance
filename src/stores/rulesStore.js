import { defineStore } from 'pinia'
import { ref } from 'vue'
import RulesService from '@/services/RulesService.js'

export const useRulesStore = defineStore('rules', () => {
  const sections = ref([])

  const fetchRules = async () => {
    try {
      sections.value = await RulesService.getAllSections()
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  return {
    sections,
    fetchRules,
  }
})
