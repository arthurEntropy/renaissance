import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  // Stable shuffled array — only reshuffled on full fetch, updated in-place on individual changes
  const shuffledArt = ref([])

  // Custom fetch: build a stable shuffled order
  const fetch = async () => {
    await base.fetch()
    shuffledArt.value = shuffleArray(base.items.value)
  }

  // art exposes the stable shuffled array directly
  const art = computed(() => shuffledArt.value)

  // Override update: sync shuffledArt in-place so the grid order is stable
  const update = async (entity) => {
    const result = await base.update(entity)
    const updated = result || entity
    // Update the specific card in-place — no reshuffle
    const idx = shuffledArt.value.findIndex(item => item.id === updated.id)
    if (idx !== -1) shuffledArt.value[idx] = updated
    return updated
  }

  // Override create: append to shuffledArt
  const create = async (entity) => {
    const result = await base.create(entity)
    if (result) shuffledArt.value.push(result)
    return result
  }

  // Override remove: splice from shuffledArt so it doesn't accumulate deleted items
  const remove = async (entity) => {
    await base.remove(entity)
    const idx = shuffledArt.value.findIndex(item => item.id === entity.id)
    if (idx !== -1) shuffledArt.value.splice(idx, 1)
  }

  const getByTypeAndSource = (type, sourceId) => {
    return art.value.filter(item =>
      item?.type === type &&
      item?.sources?.includes(sourceId)
    )
  }

  return {
    art,
    isLoading: base.isLoading,
    error: base.error,
    fetch,
    create,
    update,
    remove,
    getById: base.getById,
    getByTypeAndSource,
  }
})
