import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import EquipmentService from '@/services/entities/equipment/equipmentService'
import { useSourcesStore } from './sourcesStore'

export const useEquipmentStore = defineStore('equipment', () => {
  const base = useCrudEntityStore(EquipmentService, 'equipment')

  // Equipment whose source concept is visible for the current user role.
  // Custom items (isCustom: true) and templates are excluded from the shared view;
  // they are only accessible through a character's own EquipmentTable.
  // Equipment with no source (or 'general') is always included.
  const visibleEquipment = computed(() => {
    const sourcesStore = useSourcesStore()
    const visibleIds = new Set(sourcesStore.allSourcesFlat.map((s) => s.id))
    return base.items.value.filter(
      (item) =>
        !item.isCustom &&
        (
          !item.source ||
          item.source === 'general' ||
          item.source === 'custom' ||
          visibleIds.has(item.source)
        )
    )
  })

  // Convenience method to create a new custom equipment item
  const createCustomEquipment = async () => {
    const customEquipment = {
      ...EquipmentService.getDefaultEntity(),
      isCustom: true,
      name: 'New Custom Item'
    }
    return base.create(customEquipment)
  }

  return {
    equipment: base.items,
    visibleEquipment,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    createCustomEquipment,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
  }
})
