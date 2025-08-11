<template>
  <div class="modal-overlay concept-modal-overlay" @click.self="closeModal">
    <!-- ADMIN CONTROLS -->
    <div class="admin-controls">
      <!-- Edit/Save button -->
      <button v-if="editable" class="edit-save-button" @click="toggleEditMode"
        :title="isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'">
        {{ isEditMode ? '✓ Save' : '✎ Edit' }}
      </button>
      <!-- Settings button -->
      <button v-if="isEditMode" class="settings-button" @click="openSettingsModal" title="Card Style Settings">
        ⚙️
      </button>
    </div>
    <div class="modal-content">
      <div class="concept-detail-content">
        <!-- LEFT COLUMN -->
        <div class="concept-left-column">
          <!-- Featured Art -->
          <div class="concept-section" v-if="hasFeaturedArt || isEditMode">
            <ImageGallery :images="localConcept.artUrls || []" :editable="isEditMode" :grid-columns="5"
              @update:images="updateFeaturedArt" />
          </div>

          <!-- Novizio Section -->
          <NovizioSection ref="novizioSection" :novizio="localConcept.novizio" :editable="isEditMode"
            @update="updateNovizio" @unsaved-changes="onSectionUnsavedChanges"
            @reset-unsaved-changes="onSectionResetUnsavedChanges" />

          <!-- Faces -->
          <div class="concept-section" v-if="hasFaces || isEditMode">
            <h2 class="section-header">Faces</h2>
            <ImageGallery :images="localConcept.faces || []" :editable="isEditMode" :grid-columns="5"
              @update:images="updateFaces" />
          </div>

          <!-- Places -->
          <div class="concept-section" v-if="hasPlaces || isEditMode">
            <h2 class="section-header">Places</h2>
            <ImageGallery :images="localConcept.places || []" :editable="isEditMode" :grid-columns="5"
              @update:images="updatePlaces" />
          </div>

          <!-- Playlists -->
          <PlaylistSection :playlists="localConcept.playlists || []" :editable="isEditMode" @update="updatePlaylists" />
        </div>

        <!-- RIGHT COLUMN -->
        <div class="concept-right-column">
          <!-- Title -->
          <div class="concept-header-container">
            <div v-if="isEditingTitle" class="editable-title">
              <input type="text" v-model="localConcept.name" class="concept-title-input" ref="titleInput"
                @blur="saveTitleChanges" @keyup.enter="saveTitleChanges" @keyup.esc="cancelTitleEdit" />
            </div>
            <template v-else>
              <h1 class="concept-title" @click="startTitleEdit">
                {{ localConcept.name }}
                <span v-if="isEditMode" class="edit-section-button" title="Click to edit">✎</span>
              </h1>
              <div v-if="expansionLogoUrl" class="expansion-logo-badge-wrapper"
                :title="expansion ? `Expansion: ${expansion.name}` : 'Expansion'">
                <img :src="expansionLogoUrl" alt="Expansion Logo" class="expansion-logo-badge" />
              </div>
            </template>
          </div>

          <!-- Description -->
          <div class="description-container">
            <div v-if="isEditingDescription" class="editable-description">
              <text-editor v-model="localConcept.description" height="200px" ref="descriptionEditor"
                placeholder="description" :auto-height="true" />
              <div class="edit-field-buttons">
                <button class="button small" @click="saveDescriptionChanges">
                  Save
                </button>
                <button class="button small" @click="cancelDescriptionEdit">
                  Cancel
                </button>
              </div>
            </div>
            <div v-else class="concept-description" @click="isEditMode && startDescriptionEdit"
              v-html="safeDescription">
            </div>
            <span v-if="isEditMode && !isEditingDescription" class="edit-field-indicator" @click="startDescriptionEdit"
              title="Edit description">✎</span>
          </div>

          <!-- Traits & Abilities -->
          <div class="concept-section" v-if="hasAbilities || isEditMode">
            <h2 class="section-header">Traits & Abilities</h2>
            <div v-if="!hasAbilities && isEditMode" class="empty-section-placeholder">
              No abilities added yet. Create abilities in the "Abilities"
              section and assign them to this concept.
            </div>
            <masonry-grid v-else :column-width="350" :gap="10" :row-height="10" class="ability-cards-container">
              <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability"
                :editable="isEditMode" :sources="sources" :collapsible="false"
                :improvements="ability.improvements || []" @edit="emitAbilityEdit(ability)" :showSource="false" />
            </masonry-grid>
          </div>

          <!-- Local Flavor -->
          <LocalFlavorSection :data="{
            names: localConcept.names,
            occupations: localConcept.occupations,
            publicHouses: localConcept.publicHouses,
            vittles: localConcept.vittles,
            pointsOfInterest: localConcept.pointsOfInterest,
            floraFauna: localConcept.floraFauna,
          }" :editable="isEditMode" @update="updateLocalFlavor" @unsaved-changes="onSectionUnsavedChanges"
            @reset-unsaved-changes="onSectionResetUnsavedChanges" />

          <!-- Hooks -->
          <HooksSection :hooks="localConcept.hooks || []" :editable="isEditMode" @update="updateHooks"
            @unsaved-changes="onSectionUnsavedChanges" @reset-unsaved-changes="onSectionResetUnsavedChanges" />

          <!-- Wares -->
          <div class="concept-section" v-if="hasEquipment || isEditMode">
            <h2 class="section-header">Wares</h2>
            <masonry-grid v-if="hasEquipment || !isEditMode" :column-width="350" :gap="10" :row-height="10"
              class="equipment-cards-container">
              <EquipmentCard v-for="item in equipment" :key="item.id" :equipment="item" :editable="isEditMode"
                :sources="sources" @edit="emitEquipmentEdit" :collapsible="false" :showSource="false" />
            </masonry-grid>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- SETTINGS MODAL -->
  <SettingsModal :visible="showSettingsModal" :settings="tempSettings" @update:settings="tempSettings = $event"
    @save="saveSettings" @cancel="closeSettingsModal" />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import AbilityCard from '@/components/AbilityCard.vue'
import AbilityService from '@/services/AbilityService'
import EquipmentService from '@/services/EquipmentService'
import EquipmentCard from '@/components/EquipmentCard.vue'
import HooksSection from '@/components/conceptDetail/HooksSection.vue'
import ImageGallery from '@/components/conceptDetail/ImageGallery.vue'
import LocalFlavorSection from '@/components/conceptDetail/LocalFlavorSection.vue'
import MasonryGrid from '@/components/MasonryGrid.vue'
import PlaylistSection from '@/components/conceptDetail/PlaylistSection.vue'
import SettingsModal from '@/components/conceptDetail/ConceptSettingsModal.vue'
import TextEditor from '@/components/TextEditor.vue'
import NovizioSection from '@/components/conceptDetail/NovizioSection.vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

// Props
const props = defineProps({
  concept: {
    type: Object,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['close', 'update', 'edit-ability', 'edit-equipment', 'edit-mode-change'])

// Stores
const expansionStore = useExpansionsStore()

// Sources management
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources

// Reactive state
const abilities = ref([])
const equipment = ref([])
const localConcept = ref({})
const isEditMode = ref(false) // Always start in 'display' mode
const isEditingTitle = ref(false)
const isEditingDescription = ref(false)
const backupConcept = ref(null)
const showSettingsModal = ref(false)
const tempSettings = ref({
  backgroundImage: '',
  color1: '#ffffff',
  color2: '#000000',
})
const expansions = ref([])
const hasUnsavedSectionChanges = ref(false)

// Template refs
const titleInput = ref(null)
const descriptionEditor = ref(null)

// Abilities and Equipment functions (declared early to avoid hoisting issues)
const fetchAbilities = async () => {
  try {
    const allAbilities = await AbilityService.getAllAbilities()
    abilities.value = allAbilities.filter(
      (ability) => ability.source === localConcept.value.id,
    )
  } catch (error) {
    console.error('Error fetching abilities:', error)
  }
}

const fetchEquipment = async () => {
  try {
    const allEquipment = await EquipmentService.getAllEquipment()
    equipment.value = allEquipment.filter(
      (item) => item.source === localConcept.value.id,
    )
  } catch (error) {
    console.error('Error fetching equipment:', error)
  }
}

// Watchers
watch(() => props.concept, (newConcept) => {
  // Deep clone the concept to avoid direct mutations
  localConcept.value = JSON.parse(JSON.stringify(newConcept))
  localConcept.value.hooks = localConcept.value.hooks || []
  localConcept.value.playlists = localConcept.value.playlists || []
  localConcept.value.artUrls = localConcept.value.artUrls || []
  localConcept.value.faces = localConcept.value.faces || []
  localConcept.value.places = localConcept.value.places || []
  fetchAbilities()
  fetchEquipment()
}, { immediate: true })

// Computed properties
const hasFeaturedArt = computed(() => {
  return localConcept.value.artUrls && localConcept.value.artUrls.length > 0
})

const hasFaces = computed(() => {
  return localConcept.value.faces && localConcept.value.faces.length > 0
})

const hasPlaces = computed(() => {
  return localConcept.value.places && localConcept.value.places.length > 0
})

const hasAbilities = computed(() => {
  return abilities.value && abilities.value.length > 0
})

const hasEquipment = computed(() => {
  return equipment.value && equipment.value.length > 0
})

const expansion = computed(() => {
  if (!localConcept.value.expansion) return null
  return expansions.value.find(e => e.id === localConcept.value.expansion) || null
})

const expansionLogoUrl = computed(() => {
  return expansion.value && expansion.value.logoUrl ? expansion.value.logoUrl : ''
})

const sortedAbilities = computed(() => {
  // Sort by XP (ascending), then by name (A-Z)
  return [...abilities.value].sort((a, b) => {
    const xpA = a.xp ?? 0;
    const xpB = b.xp ?? 0;
    if (xpA !== xpB) return xpA - xpB;
    return (a.name || '').localeCompare(b.name || '');
  });
})

// Methods
const toggleEditMode = () => {
  if (isEditMode.value) {
    if (isEditingTitle.value) saveTitleChanges();
    if (isEditingDescription.value) saveDescriptionChanges();
    emitUpdateEvent();
  }
  isEditMode.value = !isEditMode.value;
  emit('edit-mode-change', isEditMode.value);
}

const emitUpdateEvent = () => {
  try {
    // Create a clean copy excluding methods and non-data properties
    const cleanConcept = {
      ...localConcept.value,

      // Handle arrays properly
      artUrls: [...(localConcept.value.artUrls || [])],
      faces: [...(localConcept.value.faces || [])],
      places: [...(localConcept.value.places || [])],

      // Process hooks and playlists to extract only necessary properties
      hooks:
        localConcept.value.hooks?.map(
          ({ id, name, description, gmNotes }) => ({
            id,
            name,
            description,
            gmNotes,
          }),
        ) || [],
      playlists:
        localConcept.value.playlists?.map(({ service, embedCode }) => ({
          service,
          embedCode,
        })) || [],
    }

    emit('update', cleanConcept)
  } catch (error) {
    console.error('Error in emitUpdateEvent:', error)
  }
}

const closeModal = () => {
  try {
    if (
      isEditingTitle.value ||
      isEditingDescription.value ||
      hasUnsavedSectionChanges.value
    ) {
      if (
        confirm('You have unsaved changes. Are you sure you want to exit?')
      ) {
        emit('close')
      }
    } else {
      emit('close')
    }
  } catch (error) {
    console.error('Error in closeDetailView:', error)
    emit('close')
  }
}

// Title editing
const startTitleEdit = () => {
  if (!isEditMode.value) return
  isEditingTitle.value = true
  backupConcept.value = { name: localConcept.value.name }
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

const saveTitleChanges = () => {
  isEditingTitle.value = false
  emitUpdateEvent()
}

const cancelTitleEdit = () => {
  localConcept.value.name = backupConcept.value.name
  isEditingTitle.value = false
}

// Description editing
const startDescriptionEdit = () => {
  if (!isEditMode.value) return
  isEditingDescription.value = true
  backupConcept.value = { description: localConcept.value.description }
}

const saveDescriptionChanges = () => {
  isEditingDescription.value = false
  emitUpdateEvent()
}

const cancelDescriptionEdit = () => {
  localConcept.value.description = backupConcept.value.description
  isEditingDescription.value = false
}

const emitAbilityEdit = (ability) => {
  if (!isEditMode.value) return
  emit('edit-ability', ability)
}

const emitEquipmentEdit = (equipmentItem) => {
  if (!isEditMode.value) return
  emit('edit-equipment', equipmentItem)
}

// Image Galleries: Featured, Faces, Places
const updateFeaturedArt = (newImages) => {
  try {
    localConcept.value.artUrls = [...newImages]
    nextTick(() => {
      emitUpdateEvent()
    })
  } catch (error) {
    console.error('Error updating art URLs:', error)
  }
}

const updateFaces = (newImages) => {
  try {
    localConcept.value.faces = [...newImages]
    nextTick(() => {
      emitUpdateEvent()
    })
  } catch (error) {
    console.error('Error updating faces:', error)
  }
}

const updatePlaces = (newImages) => {
  try {
    localConcept.value.places = [...newImages]
    nextTick(() => {
      emitUpdateEvent()
    })
  } catch (error) {
    console.error('Error updating places:', error)
  }
}

// Playlists
const updatePlaylists = (newPlaylists) => {
  try {
    localConcept.value.playlists = [...newPlaylists]
    nextTick(() => {
      emitUpdateEvent()
    })
  } catch (error) {
    console.error('Error updating playlists:', error)
  }
}

// Local Flavor
const updateLocalFlavor = (data) => {
  localConcept.value.names = data.names
  localConcept.value.occupations = data.occupations
  localConcept.value.publicHouses = data.publicHouses
  localConcept.value.vittles = data.vittles
  localConcept.value.pointsOfInterest = data.pointsOfInterest
  localConcept.value.floraFauna = data.floraFauna
  emitUpdateEvent()
}

// Hooks
const updateHooks = (newHooks) => {
  try {
    localConcept.value.hooks = [...newHooks]
    nextTick(() => {
      emitUpdateEvent()
    })
  } catch (error) {
    console.error('Error updating hooks:', error)
  }
}

// Settings Modal
const openSettingsModal = () => {
  tempSettings.value = {
    backgroundImage: localConcept.value.backgroundImage || '',
    color1: localConcept.value.color1 || '#ffffff',
    color2: localConcept.value.color2 || '#000000',
    expansionId: localConcept.value.expansion || '',
    expansion: localConcept.value.expansion || '',
  }
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const saveSettings = () => {
  localConcept.value.backgroundImage = tempSettings.value.backgroundImage
  localConcept.value.color1 = tempSettings.value.color1
  localConcept.value.color2 = tempSettings.value.color2
  localConcept.value.expansion = tempSettings.value.expansionId
  emitUpdateEvent()
  closeSettingsModal()
}

// Novizio Section
const updateNovizio = (newNovizio) => {
  localConcept.value.novizio = { ...newNovizio }
  emitUpdateEvent()
}

// Section Unsaved Changes Handling
const onSectionUnsavedChanges = () => {
  hasUnsavedSectionChanges.value = true;
}

const onSectionResetUnsavedChanges = () => {
  hasUnsavedSectionChanges.value = false;
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Prevent body scrolling when modal is open
    document.body.classList.add('modal-open');

    // Fetch expansions for badge
    await expansionStore.fetchExpansions()
    expansions.value = expansionStore.expansions

    // Sources will auto-fetch via useSources composable
    // Then fetch abilities and equipment in parallel
    await Promise.all([
      fetchAbilities(),
      fetchEquipment()
    ]);
  } catch (error) {
    console.error('Error initializing ConceptDetailModal:', error);
  }
})

onBeforeUnmount(() => {
  // Re-enable body scrolling when modal is closed
  document.body.classList.remove('modal-open');
})

// Computed properties
const safeDescription = computed(() => {
  return sanitizeHtml(localConcept.value.description || '')
})
</script>

<style scoped>
/* Modal overlay specific styles */
.concept-modal-overlay {
  overflow: hidden;
  /* Prevent scrolling on the overlay */
}

/* Admin controls */
.admin-controls {
  position: fixed;
  top: 30px;
  left: 30px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  z-index: 1001;
  /* Above modal content */
}

.edit-save-button {
  background: #4caf50;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  z-index: 10;
  min-width: 70px;
  text-align: center;
  height: 34px;
  line-height: 22px;
}

.edit-save-button:hover {
  background: #45a049;
}

.settings-button {
  position: static;
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  padding: 5px;
  transition: color 0.2s ease;
}

/* Concept content, columns */
.concept-detail-content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 40px;
  padding: 20px;
}

.concept-left-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: left;
  max-width: 500px;
  text-align: left;
}

.concept-right-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 400px;
  max-width: 710px;
  gap: 1.5rem;
}

/* Concept title */
.concept-title-container {
  display: flex;
  align-items: center;
  position: relative;
}

.concept-title {
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 10px;
  margin-bottom: 0;
  margin-top: 0;
  font-size: 3rem;
  cursor: pointer;
}

/* Title input */
.concept-title-input {
  font-size: 3rem;
  font-weight: bold;
  padding: 4px 8px;
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
}

/* Description styling */
.description-container {
  position: relative;
}

.concept-description {
  text-align: left;
  font-size: 1.1rem;
  line-height: 1.5;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
}

.edit-field-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  font-size: 0.85em;
  padding: 2px 6px;
  cursor: pointer;
  color: #aaa;
  transition: opacity 0.2s;
}

.description-container:hover .edit-field-indicator {
  opacity: 0.7;
}

/* Individual component styling from original */
.concept-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1rem;
  text-align: left;
}

.section-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.ability-cards-container,
.equipment-cards-container {
  width: 100%;
  min-height: 50px;
}

.modal-content {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* Expansion logo badge */
.expansion-logo-badge-wrapper {
  position: static;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 16px;
  z-index: 30;
}

.expansion-logo-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  background: #222;
  object-fit: cover;
  border: 2px solid #fff;
}

.concept-header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  gap: 16px;
}

@media (max-width: 900px) {
  .concept-detail-content {
    flex-direction: column;
    gap: 18px;
  }

  .concept-left-column {
    max-width: 100%;
    margin-bottom: 1rem;
  }

  .concept-right-column {
    max-width: 100%;
  }
}

/* Global styles */
:global(body.modal-open) {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
</style>
