import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import ChannelerSettingsService from '@/services/entities/channelerSettingsService'

export const useChannelerSettingsStore = defineStore('channelerSettings', () => {
  const base = useCrudEntityStore(ChannelerSettingsService, 'channeler settings')
  const fetched = ref(false)

  const manaBackgroundImages = computed(() =>
    Object.fromEntries(base.items.value.map((s) => [s.color, s.imageUrl]))
  )

  // Guard against re-fetching on every BaseCard mount.
  const fetch = async () => {
    if (fetched.value) return
    await base.fetch()
    fetched.value = true
  }

  return {
    items: base.items,
    manaBackgroundImages,
    fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
