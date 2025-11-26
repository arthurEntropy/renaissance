import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from '@/stores/composables/useBaseEntityStore'
import EquipmentGradeService from '@/services/entities/equipment/equipmentGradeService'

export const useEquipmentGradesStore = defineStore('equipmentGrades', () => {
  const base = useCrudEntityStore(EquipmentGradeService, 'equipmentGrade')

  // Sorted computed property
  const equipmentGrades = computed(() => {
    return [...base.items.value].sort((a, b) => a.index - b.index)
  })

  return {
    items: equipmentGrades,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
