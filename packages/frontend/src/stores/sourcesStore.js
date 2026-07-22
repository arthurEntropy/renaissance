import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useConceptsStore } from './conceptsStore'

export const useSourcesStore = defineStore('sources', () => {
  const conceptsStore = useConceptsStore()

  // Visibility-filtered sources — used in filter dropdowns and item browsing.
  // Respects expansion isAdminVisible / isPublic flags for the current user role.
  const sources = computed(() => ({
    ancestries: conceptsStore.visibleAncestries || [],
    cultures: conceptsStore.visibleCultures || [],
    mestieri: conceptsStore.visibleMestieri || [],
    worldElements: conceptsStore.visibleWorldElements || [],
    beastItemThemes: conceptsStore.visibleBeastItemThemes || [],
  }))

  // Flat list of visible sources for efficient set-membership checks and item filtering.
  const allSourcesFlat = computed(() => [
    ...(conceptsStore.visibleAncestries || []),
    ...(conceptsStore.visibleCultures || []),
    ...(conceptsStore.visibleMestieri || []),
    ...(conceptsStore.visibleWorldElements || []),
    ...(conceptsStore.visibleBeastItemThemes || []),
  ])

  // Unfiltered flat list — used only for display lookups (source names, types) so that
  // items a character already owns from a hidden expansion still display correctly.
  const allConceptsFlat = computed(() => [
    ...(conceptsStore.ancestries || []),
    ...(conceptsStore.cultures || []),
    ...(conceptsStore.mestieri || []),
    ...(conceptsStore.worldElements || []),
    ...(conceptsStore.beastItemThemes || []),
  ])

  const isLoading = computed(() => conceptsStore.isLoading)

  const error = computed(() => conceptsStore.error)

  const fetchSources = async () => {
    await conceptsStore.fetch()
  }

  const getSourceById = (sourceId) => {
    if (!sourceId) return null
    return allConceptsFlat.value.find(s => s.id === sourceId) || null
}

  const getSourceName = (sourceId) => {
    if (sourceId === 'general') return 'General'
    if (sourceId === 'custom') return 'Custom Items'
    const source = getSourceById(sourceId)
    return source ? source.name : 'General'
  }

  const getSourceType = (sourceId) => {
    if (!sourceId) return 'general'
    if (sourceId === 'general') return 'general'
    if (sourceId === 'custom') return 'custom'

    // Use unfiltered list so lookups work even for hidden-expansion items
    const allFlat = allConceptsFlat.value
    const source = allFlat.find((s) => s.id === sourceId)
    if (!source) return 'general'
    if (source.conceptType === 'ANCESTRY') return 'ancestry'
    if (source.conceptType === 'CULTURE') return 'culture'
    if (source.conceptType === 'MESTIERE') return 'mestiere'
    if (source.conceptType === 'WORLD_ELEMENT') return 'worldElement'
    if (source.conceptType === 'BEAST_ITEM_THEME') return 'beastItemTheme'
    return 'general'
  }

  return {
    sources,
    allSourcesFlat,
    isLoading,
    error,
    fetchSources,
    getSourceById,
    getSourceName,
    getSourceType,
  }
})
