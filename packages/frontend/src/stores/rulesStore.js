import { defineStore } from 'pinia'
import { ref } from 'vue'
import RulesService from '@/services/rulesService.js'

export const useRulesStore = defineStore('rules', () => {
  // state
  const sections = ref([])

  // actions
  const fetchRules = async () => {
    try {
      sections.value = await RulesService.getAll()
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  // getters
  const getSectionById = (id) => {
    return sections.value.find(section => section.id === id)
  }

  return {
    sections,
    fetchRules,
    getSectionById,
  }
})
