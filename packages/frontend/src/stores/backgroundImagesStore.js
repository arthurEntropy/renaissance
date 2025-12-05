import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import BackgroundImageService from '@/services/entities/backgroundImageService'

export const useBackgroundImagesStore = defineStore('backgroundImages', () => {
  const base = useCrudEntityStore(BackgroundImageService, 'background images')

  return {
    items: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
