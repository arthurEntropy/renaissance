import { defineStore } from 'pinia'
import { ref } from 'vue'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestieriService from '@/services/MestiereService'
import WorldElementsService from '@/services/WorldElementService'

export const useSourcesStore = defineStore('sources', () => {
  // state
  const sources = ref({
    ancestries: [],
    cultures: [],
    mestieri: [],
    worldElements: [],
  })
  const isLoading = ref(false)
  const hasLoaded = ref(false)

  // actions
  const fetchSources = async (force = false) => {
    if (hasLoaded.value && !force) return
    if (isLoading.value) return

    isLoading.value = true
    try {
      const [ancestries, cultures, mestieri, worldElements] = await Promise.all([
        AncestryService.getAllAncestries(),
        CultureService.getAllCultures(),
        MestieriService.getAllMestieri(),
        WorldElementsService.getAllWorldElements(),
      ])

      sources.value = { ancestries, cultures, mestieri, worldElements }
      hasLoaded.value = true
    } catch (error) {
      console.error('Error fetching sources:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // auto-fetch on first use
  if (!hasLoaded.value && !isLoading.value) {
    fetchSources().catch((e) => console.error('Auto-fetch sources failed:', e))
  }

  // helpers
  const getSourceById = (sourceId) => {
    if (!sourceId) return null
    return (
      sources.value.ancestries.find((s) => s.id === sourceId) ||
      sources.value.cultures.find((s) => s.id === sourceId) ||
      sources.value.mestieri.find((s) => s.id === sourceId) ||
      sources.value.worldElements.find((s) => s.id === sourceId) ||
      null
    )
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
    isLoading,
    hasLoaded,
    fetchSources,
    getSourceById,
    getSourceName,
    getSourceType,
  }
})
