import { computed } from 'vue'

export function useRulesContentUpdates(currentSection, markAsChanged) {
  
  // Methods for updating section content
  const updateSectionName = (newName) => {
    if (currentSection.value) {
      currentSection.value.name = newName
      markAsChanged()
    }
  }
  
  const updateImageUrl = (newUrl) => {
    if (currentSection.value) {
      currentSection.value.imageUrl = newUrl
      markAsChanged()
    }
  }
  
  const updateContent = (newContent) => {
    if (currentSection.value) {
      currentSection.value.content = newContent
      markAsChanged()
    }
  }
  
  // Helper to update any section property
  const updateSectionProperty = (property, value) => {
    if (currentSection.value && property in currentSection.value) {
      currentSection.value[property] = value
      markAsChanged()
    }
  }
  
  // Batch update multiple properties
  const updateSectionProperties = (updates) => {
    if (currentSection.value) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key in currentSection.value) {
          currentSection.value[key] = value
        }
      })
      markAsChanged()
    }
  }
  
  // Computed for checking if section has content
  const hasContent = computed(() => {
    return currentSection.value && (
      currentSection.value.content ||
      currentSection.value.imageUrl ||
      currentSection.value.name !== 'New Section'
    )
  })
  
  return {
    // Methods
    updateSectionName,
    updateImageUrl,
    updateContent,
    updateSectionProperty,
    updateSectionProperties,
    
    // Computed
    hasContent,
  }
}
