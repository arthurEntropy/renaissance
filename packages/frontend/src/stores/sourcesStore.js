import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useConceptsStore } from './conceptsStore'

export const useSourcesStore = defineStore('sources', () => {
  const conceptsStore = useConceptsStore()

  const sources = computed(() => ({
    ancestries: conceptsStore.ancestries || [],
    cultures: conceptsStore.cultures || [],
    mestieri: conceptsStore.mestieri || [],
    worldElements: conceptsStore.worldElements || [],
  }))

  // Flat list of all sources for efficient lookups
  const allSourcesFlat = computed(() => [
    ...(conceptsStore.ancestries || []),
    ...(conceptsStore.cultures || []),
    ...(conceptsStore.mestieri || []),
    ...(conceptsStore.worldElements || [])
  ])

  const isLoading = computed(() => conceptsStore.isLoading)

  const error = computed(() => conceptsStore.error)

  const fetchSources = async () => {
    await conceptsStore.fetch()
  }

  const getSourceById = (sourceId) => {
    if (!sourceId) return null
    return allSourcesFlat.value.find(s => s.id === sourceId) || null
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

    if (sources.value.ancestries.find((s) => s.id === sourceId)) return 'ancestry'
    if (sources.value.cultures.find((s) => s.id === sourceId)) return 'culture'
    if (sources.value.mestieri.find((s) => s.id === sourceId)) return 'mestiere'
    if (sources.value.worldElements.find((s) => s.id === sourceId)) return 'worldElement'
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
