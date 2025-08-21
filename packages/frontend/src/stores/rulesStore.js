import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import RulesService from '@/services/rulesService.js'

export const useRulesStore = defineStore('rules', () => {
  // state
  const sections = ref([])

  // actions
  const fetch = async () => {
    try {
      sections.value = await RulesService.getAll()
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  // getters
  const getById = (id) => {
    return sections.value.find(section => section.id === id)
  }

  const filteredSections = computed(() => {
    // Filter out deleted and sort sections by index
    return sections.value
      ? [...sections.value]
        .filter(section => !section.isDeleted)
        .sort((a, b) => a.index - b.index)
      : []
  })

  return {
    sections,
    fetch,
    getById,
    filteredSections,
  }
})
