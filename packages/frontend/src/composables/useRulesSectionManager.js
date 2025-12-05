import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRulesStore } from '@/stores/rulesStore'
import RulesService from '@/services/entities/rulesService'

/**
 * Composable for managing rules sections
 * Handles section CRUD operations, navigation, URL routing, and localStorage persistence
 */
export function useRulesSectionManager() {
  const rulesStore = useRulesStore()
  const route = useRoute()
  const router = useRouter()
  
  // State
  const currentSection = ref(null)
  const selectedSectionId = ref(null)
  const localSections = ref([])
  const sectionToDelete = ref(null)
  
  // Computed
  const filteredSections = computed(() => {
    // Filter out deleted and sort sections by index
    return rulesStore.sections
      ? [...rulesStore.sections]
        .filter(section => !section.isDeleted)
        .sort((a, b) => a.index - b.index)
      : []
  })
  
  // Watch for changes to filtered sections and update local copy
  watch(filteredSections, (newValue) => {
    localSections.value = JSON.parse(JSON.stringify(newValue))
  }, { immediate: true })
  
  // Watch for route changes (browser back/forward)
  watch(() => route.params.id, (newId) => {
    if (newId) {
      const urlName = newId.toLowerCase()
      const sectionFromUrl = filteredSections.value?.find(section =>
        section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === urlName
      )
      if (sectionFromUrl && currentSection.value?.id !== sectionFromUrl.id) {
        selectSection(sectionFromUrl.id, { skipUrlUpdate: true })
      }
    }
  })
  
  // Methods
  const selectSection = async (sectionId, { onUnsavedChanges, skipUrlUpdate = false } = {}) => {
    // Skip if we're trying to select the already selected section
    if (currentSection.value?.id === sectionId) return
    
    // Handle unsaved changes if callback provided
    if (onUnsavedChanges) {
      const shouldSave = await onUnsavedChanges()
      if (shouldSave === false) return // User cancelled
    }
    
    // Find and set the selected section
    const section = filteredSections.value?.find(s => s.id === sectionId)
    if (section) {
      // Deep copy to avoid modifying the store data
      currentSection.value = { ...section }
      selectedSectionId.value = sectionId
      localStorage.setItem('lastSelectedSectionId', sectionId)
      
      // Update URL with section name (only if not already there and not skipped)
      if (!skipUrlUpdate) {
        const urlName = section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        if (route.params.id !== urlName) {
          router.push(`/rules/${urlName}`)
        }
      }
    }
  }
  
  const createNewSection = async ({ onSuccess } = {}) => {
    try {
      // Create the new section and refresh the sections list
      const newSection = await RulesService.create()
      await rulesStore.fetch()
      
      // Confirm the section was created and select it
      const sectionToSelect = filteredSections.value?.find(
        s => (s.id && s.id === newSection.id) || (!s.id && s.name === newSection.name)
      )
      
      if (sectionToSelect) {
        await selectSection(sectionToSelect.id)
        if (onSuccess) {
          onSuccess(sectionToSelect)
        }
      } else {
        console.error("Couldn't find the newly created section")
      }
      
      return newSection
    } catch (error) {
      console.error('Error creating new section:', error)
      throw error
    }
  }
  
  const confirmDeleteSection = (section) => {
    sectionToDelete.value = section
    if (window.confirm(`Are you sure you want to delete "${section.name}"?`)) {
      return deleteSection()
    } else {
      sectionToDelete.value = null
      return Promise.resolve(false)
    }
  }
  
  const deleteSection = async () => {
    if (!sectionToDelete.value) return
    
    // Store the section ID before it gets set to null
    const deletedSectionId = sectionToDelete.value.id
    
    // Create a new object to ensure we're not modifying a potentially frozen object
    const sectionToUpdate = { ...sectionToDelete.value, isDeleted: true }
    
    try {
      sectionToDelete.value = null
      await RulesService.update(sectionToUpdate)
      await rulesStore.fetch()
      
      // If the deleted section was the current section, select another one
      if (currentSection.value && currentSection.value.id === deletedSectionId) {
        currentSection.value = null
        if (filteredSections.value?.length > 0) {
          selectSection(filteredSections.value[0].id)
        }
      }
      
      return true
    } catch (error) {
      console.error('Error deleting section:', error)
      throw error
    }
  }
  
  const updateSectionsOrder = async () => {
    try {
      await RulesService.reorderSections(localSections.value)
      await rulesStore.fetch()
    } catch (error) {
      console.error('Error updating section order:', error)
      throw error
    }
  }
  
  const updateLocalSections = (newSections) => {
    localSections.value = newSections
  }
  
  const initializeSections = async () => {
    try {
      await rulesStore.fetch()
      
      // Use store sections directly and filter them
      const sections = rulesStore.sections || []
      const availableSections = sections
        .filter(section => !section.isDeleted)
        .sort((a, b) => a.index - b.index)
      
      // First priority: Check if there's a section name in the URL
      if (route.params.id) {
        const urlName = route.params.id.toLowerCase()
        const sectionFromUrl = availableSections.find(section =>
          section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === urlName
        )
        if (sectionFromUrl) {
          await selectSection(sectionFromUrl.id, { skipUrlUpdate: true })
          return
        }
      }
      
      // Second priority: Select the last selected section from localStorage if available
      const lastSelectedSectionId = localStorage.getItem('lastSelectedSectionId')
      const sectionExists = lastSelectedSectionId &&
        availableSections.some(section => section.id === lastSelectedSectionId)
      
      if (sectionExists) {
        selectSection(lastSelectedSectionId)
      } else if (availableSections.length > 0) {
        selectSection(availableSections[0].id)
      }
    } catch (error) {
      console.error('Error initializing sections:', error)
      throw error
    }
  }
  
  return {
    // State
    currentSection,
    selectedSectionId,
    localSections,
    filteredSections,
    
    // Methods
    selectSection,
    createNewSection,
    confirmDeleteSection,
    deleteSection,
    updateSectionsOrder,
    updateLocalSections,
    initializeSections,
  }
}
