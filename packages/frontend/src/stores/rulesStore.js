import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import RulesService from '@/services/entities/rulesService'

export const useRulesStore = defineStore('rules', () => {
  const { items: sections, fetch, refresh, getById } = useBaseEntityStore(
    RulesService,
    'rules'
  )

  const selectedSection = ref(null)

  const filteredSections = computed(() => {
    return sections.value
      ? [...sections.value]
        .filter(section => !section.isDeleted)
        .sort((a, b) => a.index - b.index)
      : []
  })

  const selectSection = (section) => {
    selectedSection.value = section
  }

  const deselectSection = () => {
    selectedSection.value = null
  }

  return {
    sections,
    selectedSection,
    fetch,
    refresh,
    getById,
    filteredSections,
    selectSection,
    deselectSection,
  }
})
