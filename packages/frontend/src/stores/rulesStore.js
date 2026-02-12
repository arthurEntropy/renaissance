import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import RulesService from '@/services/entities/rulesService'

export const useRulesStore = defineStore('rules', () => {
  const base = useCrudEntityStore(RulesService, 'rules')

  const selectedSection = ref(null)

  const sections = computed(() => base.items.value)

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
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
    filteredSections,
    selectSection,
    deselectSection,
  }
})
