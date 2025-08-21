import { ref } from 'vue'
import RulesService from '@/services/rulesService'
import { useRulesStore } from '@/stores/rulesStore'

export function useRulesEditMode() {
  const rulesStore = useRulesStore()
  
  // State
  const isContentEditMode = ref(false)
  const isStructureEditMode = ref(false)
  const unsavedChanges = ref(false)
  
  // Methods
  const markAsChanged = () => {
    unsavedChanges.value = true
  }
  
  const saveSection = async (section) => {
    if (section) {
      await RulesService.update(section)
      await rulesStore.fetch()
      unsavedChanges.value = false
    }
  }
  
  const toggleContentEditMode = async (currentSection) => {
    // Don't allow entering content edit mode if structure edit mode is active
    if (isStructureEditMode.value) return false
    
    if (isContentEditMode.value) {
      await saveSection(currentSection)
    }
    isContentEditMode.value = !isContentEditMode.value
    return true
  }
  
  const toggleStructureEditMode = () => {
    // Don't allow entering structure edit mode if content edit mode is active
    if (isContentEditMode.value) return false
    
    isStructureEditMode.value = !isStructureEditMode.value
    return true
  }
  
  const exitContentEditMode = () => {
    isContentEditMode.value = false
  }
  
  const exitStructureEditMode = () => {
    isStructureEditMode.value = false
  }
  
  const handleUnsavedChanges = async (currentSection) => {
    if (isContentEditMode.value && unsavedChanges.value) {
      if (confirm('You have unsaved changes. Do you want to save before continuing?')) {
        await saveSection(currentSection)
        return true
      } else {
        unsavedChanges.value = false
        return true
      }
    }
    return true
  }
  
  const canPerformAction = (action) => {
    switch (action) {
      case 'content-edit':
        return !isStructureEditMode.value
      case 'structure-edit':
        return !isContentEditMode.value
      case 'create-section':
        return !isContentEditMode.value
      case 'delete-section':
        return !isContentEditMode.value
      case 'reorder-sections':
        return !isContentEditMode.value
      default:
        return true
    }
  }
  
  return {
    // State
    isContentEditMode,
    isStructureEditMode,
    unsavedChanges,
    
    // Methods
    markAsChanged,
    saveSection,
    toggleContentEditMode,
    toggleStructureEditMode,
    exitContentEditMode,
    exitStructureEditMode,
    handleUnsavedChanges,
    canPerformAction,
  }
}
