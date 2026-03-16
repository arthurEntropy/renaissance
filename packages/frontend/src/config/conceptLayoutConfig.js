import { ConceptType } from '@shared/constants/conceptTypes.js'

// Maps each ConceptType to boolean flags controlling section visibility in ConceptDetail.
export const CONCEPT_LAYOUT_CONFIGS = {
  [ConceptType.MESTIERE]: {
    showNovizio: true,
    showFaces: false,
    combineFacesWithFeatured: true,
    showPlaces: false,
    showMaps: false,
    showLocalFlavor: false,
    showHooks: false,
    showPlaylist: false,
    showAbilities: true,
    showEquipment: true,
  },
  [ConceptType.CULTURE]: {
    showNovizio: false,
    showFaces: true,
    showPlaces: true,
    showMaps: true,
    showLocalFlavor: true,
    showHooks: true,
    showPlaylist: true,
    showAbilities: true,
    showEquipment: true,
  },
  [ConceptType.ANCESTRY]: {
    showNovizio: false,
    showFaces: false,
    combineFacesWithFeatured: true,
    showPlaces: false,
    showMaps: false,
    showLocalFlavor: false,
    showHooks: false,
    showPlaylist: false,
    showAbilities: true,
    showEquipment: false,
  },
  [ConceptType.WORLD_ELEMENT]: {
    showNovizio: false,
    showFaces: true,
    showPlaces: true,
    showMaps: true,
    showLocalFlavor: true,
    showHooks: true,
    showPlaylist: true,
    showAbilities: true,
    showEquipment: true,
  },
}

// Shown when no concept is selected or the type is unrecognised
export const DEFAULT_LAYOUT_CONFIG = {
  showNovizio: false,
  showFaces: true,
  combineFacesWithFeatured: false,
  showPlaces: true,
  showMaps: true,
  showLocalFlavor: true,
  showHooks: true,
  showPlaylist: true,
  showAbilities: true,
  showEquipment: true,
}
