import { defineStore } from 'pinia'
import { ref } from 'vue'
import AncestryService from '@/services/entities/gameConcepts/ancestryService'
import CultureService from '@/services/entities/gameConcepts/cultureService'
import MestiereService from '@/services/entities/gameConcepts/mestiereService'
import WorldElementService from '@/services/entities/gameConcepts/worldElementService'

/**
 * Aggregator store for all game concept sources
 * Provides centralized access to ancestries, cultures, mestieri, and world elements
 * Used primarily for source selection in UI components
 */
export const useSourcesStore = defineStore('sources', () => {
  // State
  const sources = ref({
    ancestries: [],
    cultures: [],
    mestieri: [],
    worldElements: [],
  })
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  const fetchSources = async () => {
    isLoading.value = true
    error.value = null
    try {
      const [ancestries, cultures, mestieri, worldElements] = await Promise.all([
        AncestryService.getAll(),
        CultureService.getAll(),
        MestiereService.getAll(),
        WorldElementService.getAll(),
      ])
      sources.value = { ancestries, cultures, mestieri, worldElements }
    } catch (err) {
      console.error('Error fetching sources:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Helpers
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
    error,
    fetchSources,
    getSourceById,
    getSourceName,
    getSourceType,
  }
})
