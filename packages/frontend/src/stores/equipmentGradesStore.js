import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBaseEntityStore } from '@/stores/composables/useBaseEntityStore'
import EquipmentGradeService from '@/services/entities/equipment/equipmentGradeService'

export const useEquipmentGradesStore = defineStore('equipmentGrades', () => {
  const base = useBaseEntityStore(EquipmentGradeService)

  // Sorted computed property
  const equipmentGrades = computed(() => {
    return [...base.items.value].sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  return {
    items: equipmentGrades,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
  }
})
