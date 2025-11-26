import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import RulesService from '@/services/entities/rulesService'

export const useRulesStore = defineStore('rules', () => {
  const { items: sections, fetch, getById } = useBaseEntityStore(
    RulesService,
    'rules'
  )

  // Computed property for sorted sections
  const filteredSections = computed(() => {
    return sections.value
      ? [...sections.value].sort((a, b) => a.index - b.index)
      : []
  })

  return {
    sections,
    fetch,
    getById,
    filteredSections,
  }
})
