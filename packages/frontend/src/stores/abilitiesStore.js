import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import AbilityService from '@/services/entities/abilityService'
import { useSourcesStore } from './sourcesStore'

export const useAbilitiesStore = defineStore('abilities', () => {
  const base = useCrudEntityStore(AbilityService, 'abilities')

  // Abilities whose source concept is visible for the current user role.
  // Abilities with no source (or 'general') are always included.
  const visibleAbilities = computed(() => {
    const sourcesStore = useSourcesStore()
    const visibleIds = new Set(sourcesStore.allSourcesFlat.map((s) => s.id))
    return base.items.value.filter(
      (item) => !item.source || item.source === 'general' || visibleIds.has(item.source)
    )
  })

  return {
    abilities: base.items,
    visibleAbilities,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
  }
})
