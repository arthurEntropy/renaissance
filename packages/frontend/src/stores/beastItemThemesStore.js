import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useConceptsStore } from './conceptsStore'
import { ConceptType } from '@shared/constants/conceptTypes'

export const useBeastItemThemesStore = defineStore('beastItemThemes', () => {
  const conceptsStore = useConceptsStore()

  const items = computed(() => conceptsStore.beastItemThemes || [])

  const create = (data = {}) => {
    return conceptsStore.create({ ...data, conceptType: ConceptType.BEAST_ITEM_THEME })
  }

  return {
    items,
    isLoading: conceptsStore.isLoading,
    error: conceptsStore.error,
    fetch: conceptsStore.fetch,
    getById: conceptsStore.getById,
    create,
    update: conceptsStore.update,
    remove: conceptsStore.remove,
  }
})
