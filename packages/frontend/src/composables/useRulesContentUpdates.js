/**
 * Composable for updating rules section content
 * Handles content mutations and tracks changes
 */
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
  
  return {
    updateSectionName,
    updateImageUrl,
    updateContent,
  }
}
