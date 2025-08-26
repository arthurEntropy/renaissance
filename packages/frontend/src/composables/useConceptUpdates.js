/**
 * Composable for handling concept property updates
 * Provides a generic update function and specific update methods
 */
export function useConceptUpdates(localConcept, emitUpdateEvent) {
  const updateProperty = (property, value) => {
    if (Array.isArray(value)) {
      localConcept.value[property] = [...value]
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(localConcept.value, value)
    } else {
      localConcept.value[property] = value
    }
    emitUpdateEvent()
  }

  // Specific update methods
  const updateName = (newName) => updateProperty('name', newName)
  const updateDescription = (newDescription) => updateProperty('description', newDescription)
  const updateFeaturedArt = (newImages) => updateProperty('artUrls', newImages)
  const updateFaces = (newImages) => updateProperty('faces', newImages)
  const updatePlaces = (newImages) => updateProperty('places', newImages)
  const updateNovizio = (newNovizio) => updateProperty('novizio', newNovizio)
  const updatePlaylists = (newPlaylists) => updateProperty('playlists', newPlaylists)
  const updateHooks = (newHooks) => updateProperty('hooks', newHooks)
  const updateLocalFlavor = (newLocalFlavor) => {
    Object.assign(localConcept.value, newLocalFlavor)
    emitUpdateEvent()
  }

  return {
    updateProperty,
    updateName,
    updateDescription,
    updateFeaturedArt,
    updateFaces,
    updatePlaces,
    updateNovizio,
    updatePlaylists,
    updateHooks,
    updateLocalFlavor
  }
}
