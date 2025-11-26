import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import ArtService from '@/services/entities/artService'

export const useArtStore = defineStore('art', () => {
  const base = useCrudEntityStore(ArtService, 'art')

  // Helper function to shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Shuffled art for visual variety on repeat viewings
  // This computed will re-shuffle whenever base.items reference changes (on fetch)
  const art = computed(() => shuffleArray(base.items.value))

  const getByTypeAndSource = (type, sourceId) => {
    return art.value.filter(item => 
      item?.tags?.type === type && 
      item?.tags?.sources?.includes(sourceId)
    )
  }

  return {
    art,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
    getByTypeAndSource,
  }
})
