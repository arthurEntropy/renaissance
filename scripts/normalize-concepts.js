import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const conceptsDir = path.join(__dirname, '../data/concepts')

/**
 * Field ordering for each concept type
 */
const fieldOrder = {
  ANCESTRY: [
    'id',
    'conceptType',
    'name',
    'description',
    'isDeleted',
    'featuredArtUrls',
    'backgroundImage',
    'cardBackgroundImage',
    'expansion',
    'lastModified',
    'physiology',
  ],
  CULTURE: [
    'id',
    'conceptType',
    'name',
    'description',
    'isDeleted',
    'featuredArtUrls',
    'backgroundImage',
    'cardBackgroundImage',
    'expansion',
    'playlists',
    'hooks',
    'localFlavor',
    'lastModified',
  ],
  MESTIERE: [
    'id',
    'conceptType',
    'name',
    'description',
    'isDeleted',
    'featuredArtUrls',
    'backgroundImage',
    'cardBackgroundImage',
    'expansion',
    'novizio',
    'lastModified',
  ],
  WORLD_ELEMENT: [
    'id',
    'conceptType',
    'name',
    'description',
    'isDeleted',
    'featuredArtUrls',
    'backgroundImage',
    'cardBackgroundImage',
    'expansion',
    'lastModified',
  ],
}

/**
 * Normalize a concept object
 */
function normalizeConcept(concept) {
  const conceptType = concept.conceptType

  // Rename artUrls to featuredArtUrls
  if ('artUrls' in concept) {
    concept.featuredArtUrls = concept.artUrls
    delete concept.artUrls
  }

  // Rename old backgroundImage → cardBackgroundImage (was card/ability bg)
  // Rename old detailBackgroundImage → backgroundImage (was full-page detail bg)
  // Swap both fields atomically using a sentinel
  const hadDetailBg = 'detailBackgroundImage' in concept
  const hadBg = 'backgroundImage' in concept
  const oldDetailBg = concept.detailBackgroundImage
  const oldBg = concept.backgroundImage

  if (hadDetailBg) delete concept.detailBackgroundImage
  if (hadBg) delete concept.backgroundImage

  // Old detailBackgroundImage becomes new backgroundImage (detail page bg)
  concept.backgroundImage = hadDetailBg ? (oldDetailBg ?? '') : ''
  // Old backgroundImage becomes new cardBackgroundImage (card bg)
  concept.cardBackgroundImage = hadBg ? (oldBg ?? '') : ''

  // Remove unwanted fields
  delete concept.faces
  delete concept.places

  // Handle Ancestry-specific normalization
  if (conceptType === 'ANCESTRY') {
    if (
      concept.heightMin !== undefined ||
      concept.heightMax !== undefined ||
      concept.weightMin !== undefined ||
      concept.weightMax !== undefined ||
      concept.lifespan !== undefined ||
      concept.speed !== undefined
    ) {
      concept.physiology = {
        heightMin: concept.heightMin ?? 0,
        heightMax: concept.heightMax ?? 0,
        weightMin: concept.weightMin ?? 0,
        weightMax: concept.weightMax ?? 0,
        lifespan: concept.lifespan ?? '',
        speed: concept.speed ?? 30,
      }
      delete concept.heightMin
      delete concept.heightMax
      delete concept.weightMin
      delete concept.weightMax
      delete concept.lifespan
      delete concept.speed
    }

    // Remove culture-specific fields if they exist
    delete concept.names
    delete concept.occupations
    delete concept.publicHouses
    delete concept.vittles
    delete concept.pointsOfInterest
    delete concept.floraFauna
    delete concept.hooks
    delete concept.playlists
  }

  // Handle Culture-specific normalization
  if (conceptType === 'CULTURE') {
    // Nest local flavor fields
    if (
      concept.names !== undefined ||
      concept.occupations !== undefined ||
      concept.publicHouses !== undefined ||
      concept.vittles !== undefined ||
      concept.pointsOfInterest !== undefined ||
      concept.floraFauna !== undefined
    ) {
      concept.localFlavor = {
        names: concept.names ?? '',
        occupations: concept.occupations ?? '',
        publicHouses: concept.publicHouses ?? '',
        vittles: concept.vittles ?? '',
        pointsOfInterest: concept.pointsOfInterest ?? '',
        floraFauna: concept.floraFauna ?? '',
      }
      delete concept.names
      delete concept.occupations
      delete concept.publicHouses
      delete concept.vittles
      delete concept.pointsOfInterest
      delete concept.floraFauna
    }

    // Remove ancestry-specific fields if they exist
    delete concept.heightMin
    delete concept.heightMax
    delete concept.weightMin
    delete concept.weightMax
    delete concept.lifespan
    delete concept.speed
    delete concept.physiology
  }

  // Handle WorldElement and Mestiere - remove culture and ancestry fields
  if (conceptType === 'WORLD_ELEMENT' || conceptType === 'MESTIERE') {
    delete concept.names
    delete concept.occupations
    delete concept.publicHouses
    delete concept.vittles
    delete concept.pointsOfInterest
    delete concept.floraFauna
    delete concept.heightMin
    delete concept.heightMax
    delete concept.weightMin
    delete concept.weightMax
    delete concept.lifespan
    delete concept.speed
    delete concept.physiology
    delete concept.localFlavor

    // For WorldElement, also remove these
    if (conceptType === 'WORLD_ELEMENT') {
      delete concept.novizio
      delete concept.hooks
      delete concept.playlists
    }
  }

  // Reorder fields
  const order = fieldOrder[conceptType] || Object.keys(concept)
  const ordered = {}
  for (const key of order) {
    if (key in concept) {
      ordered[key] = concept[key]
    }
  }
  // Add any remaining fields that weren't in the order
  for (const key in concept) {
    if (!(key in ordered)) {
      ordered[key] = concept[key]
    }
  }

  return ordered
}

/**
 * Main normalization function
 */
async function normalizeAllConcepts() {
  try {
    const files = await fs.readdir(conceptsDir)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    console.log(`Found ${jsonFiles.length} concept files to normalize`)

    let normalized = 0
    let errors = 0

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(conceptsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const concept = JSON.parse(content)

        const normalized_concept = normalizeConcept(concept)

        await fs.writeFile(filePath, JSON.stringify(normalized_concept, null, 2) + '\n')
        normalized++
        console.log(`✓ ${file}`)
      } catch (error) {
        errors++
        console.error(`✗ ${file}: ${error.message}`)
      }
    }

    console.log(`\nNormalization complete: ${normalized} successful, ${errors} errors`)
  } catch (error) {
    console.error('Error reading concepts directory:', error.message)
    process.exit(1)
  }
}

normalizeAllConcepts()
