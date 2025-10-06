import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import EquipmentTypeService from '@/services/equipmentTypeService'
import EquipmentSubtypeService from '@/services/equipmentSubtypeService'
import EquipmentGradeService from '@/services/equipmentGradeService'
import EquipmentRangeService from '@/services/equipmentRangeService'

export const useEquipmentCategoriesStore = defineStore('equipmentCategories', () => {
  // state
  const equipmentTypes = ref([])
  const equipmentSubtypes = ref([])
  const equipmentGrades = ref([])
  const equipmentRanges = ref([])

  // actions
  const fetchEquipmentTypes = async () => {
    try {
      equipmentTypes.value = await EquipmentTypeService.getAll()
    } catch (error) {
      console.error('Error fetching equipment types:', error)
    }
  }

  const fetchEquipmentSubtypes = async () => {
    try {
      equipmentSubtypes.value = await EquipmentSubtypeService.getAll()
    } catch (error) {
      console.error('Error fetching equipment subtypes:', error)
    }
  }

  const fetchEquipmentGrades = async () => {
    try {
      equipmentGrades.value = await EquipmentGradeService.getAll()
    } catch (error) {
      console.error('Error fetching equipment grades:', error)
    }
  }

  const fetchEquipmentRanges = async () => {
    try {
      equipmentRanges.value = await EquipmentRangeService.getAll()
    } catch (error) {
      console.error('Error fetching equipment ranges:', error)
    }
  }

  const fetchAll = async () => {
    await Promise.all([
      fetchEquipmentTypes(),
      fetchEquipmentSubtypes(),
      fetchEquipmentGrades(),
      fetchEquipmentRanges()
    ])
  }

  // computed getters with sorting
  const sortedEquipmentTypes = computed(() => {
    return [...equipmentTypes.value].sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  const sortedEquipmentSubtypes = computed(() => {
    return [...equipmentSubtypes.value].sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  const sortedEquipmentGrades = computed(() => {
    return [...equipmentGrades.value].sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  const sortedEquipmentRanges = computed(() => {
    return [...equipmentRanges.value].sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  const getSubtypesByType = computed(() => (typeId) => {
    if (!typeId) return []
    return equipmentSubtypes.value
      .filter(subtype => subtype.typeId === typeId)
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  // getter methods (use original raw arrays for lookups)
  const getEquipmentTypeById = (typeId) => {
    if (!typeId) return null
    return equipmentTypes.value.find(type => type.id === typeId)
  }

  const getEquipmentSubtypeById = (subtypeId) => {
    if (!subtypeId) return null
    return equipmentSubtypes.value.find(subtype => subtype.id === subtypeId)
  }

  const getEquipmentGradeById = (gradeId) => {
    if (!gradeId) return null
    return equipmentGrades.value.find(grade => grade.id === gradeId)
  }

  const getEquipmentRangeById = (rangeId) => {
    if (!rangeId) return null
    return equipmentRanges.value.find(range => range.id === rangeId)
  }

  return {
    equipmentTypes: sortedEquipmentTypes,
    equipmentSubtypes: sortedEquipmentSubtypes,
    equipmentGrades: sortedEquipmentGrades,
    equipmentRanges: sortedEquipmentRanges,
    rawEquipmentTypes: equipmentTypes,
    rawEquipmentSubtypes: equipmentSubtypes,
    rawEquipmentGrades: equipmentGrades,
    rawEquipmentRanges: equipmentRanges,
    fetchEquipmentTypes,
    fetchEquipmentSubtypes,
    fetchEquipmentGrades,
    fetchEquipmentRanges,
    fetchAll,
    getSubtypesByType,
    getEquipmentTypeById,
    getEquipmentSubtypeById,
    getEquipmentGradeById,
    getEquipmentRangeById,
  }
})