import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAncestriesStore } from './ancestriesStore'
import { useCulturesStore } from './culturesStore'
import { useMestieriStore } from './mestieriStore'
import { useWorldElementsStore } from './worldElementsStore'

export const useSourcesStore = defineStore('sources', () => {
  const ancestriesStore = useAncestriesStore()
  const culturesStore = useCulturesStore()
  const mestieriStore = useMestieriStore()
  const worldElementsStore = useWorldElementsStore()

  const sources = computed(() => ({
    ancestries: ancestriesStore.ancestries || [],
    cultures: culturesStore.cultures || [],
    mestieri: mestieriStore.mestieri || [],
    worldElements: worldElementsStore.worldElements || [],
  }))

  const isLoading = computed(
    () =>
      ancestriesStore.isLoading ||
      culturesStore.isLoading ||
      mestieriStore.isLoading ||
      worldElementsStore.isLoading
  )

  const error = computed(
    () =>
      ancestriesStore.error ||
      culturesStore.error ||
      mestieriStore.error ||
      worldElementsStore.error
  )

  const fetchSources = async () => {
    await Promise.all([
      ancestriesStore.fetch(),
      culturesStore.fetch(),
      mestieriStore.fetch(),
      worldElementsStore.fetch(),
    ])
  }

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
