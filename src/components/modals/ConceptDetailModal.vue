<template>
  <div class="modal-overlay" @click.self="closeModal">
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
              v-html="localConcept.description">
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
                :editable="isEditMode" :sources="sources" :collapsible="false" @edit="emitAbilityEdit(ability)" />
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
          }" :editable="isEditMode" @update="updateLocalFlavor" />

          <!-- Hooks -->
          <HooksSection :hooks="localConcept.hooks || []" :editable="isEditMode" @update="updateHooks" />

          <!-- Wares -->
          <div class="concept-section" v-if="hasEquipment || isEditMode">
            <h2 class="section-header">Wares</h2>
            <masonry-grid v-if="hasEquipment || !isEditMode" :column-width="350" :gap="10" :row-height="10"
              class="equipment-cards-container">
              <EquipmentCard v-for="item in equipment" :key="item.id" :equipment="item" :editable="isEditMode"
                :sources="sources" @edit="emitEquipmentEdit" :collapsible="false" />
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

<script>
import { defineComponent } from 'vue'
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
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useExpansionStore } from '@/stores/expansionStore'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestiereService from '@/services/MestiereService'
import WorldElementService from '@/services/WorldElementService'

export default defineComponent({
  props: {
    concept: {
      type: Object,
      required: true,
    },
    editable: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    AbilityCard,
    EquipmentCard,
    HooksSection,
    ImageGallery,
    LocalFlavorSection,
    MasonryGrid,
    PlaylistSection,
    SettingsModal,
    TextEditor,
  },
  emits: ['close', 'update', 'edit-ability', 'edit-equipment'],
  data() {
    return {
      abilities: [],
      equipment: [],
      localConcept: {},
      isEditMode: false, // Always start as false
      isEditingTitle: false,
      isEditingDescription: false,
      backupConcept: null,
      showSettingsModal: false,
      tempSettings: {
        backgroundImage: '',
        color1: '#ffffff',
        color2: '#000000',
      },
      sources: {
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      },
      abilitiesStore: useAbilitiesStore(),
      equipmentStore: useEquipmentStore(),
      expansionStore: useExpansionStore(),
      expansions: [],
    }
  },
  watch: {
    concept: {
      immediate: true,
      handler(newConcept) {
        // Deep clone the concept to avoid direct mutations
        this.localConcept = JSON.parse(JSON.stringify(newConcept))
        this.localConcept.hooks = this.localConcept.hooks || []
        this.localConcept.playlists = this.localConcept.playlists || []
        this.localConcept.artUrls = this.localConcept.artUrls || []
        this.localConcept.faces = this.localConcept.faces || []
        this.localConcept.places = this.localConcept.places || []
        this.fetchAbilities()
        this.fetchEquipment()
      },
    },
  },
  computed: {
    hasFeaturedArt() {
      return this.localConcept.artUrls && this.localConcept.artUrls.length > 0
    },
    hasFaces() {
      return this.localConcept.faces && this.localConcept.faces.length > 0
    },
    hasPlaces() {
      return this.localConcept.places && this.localConcept.places.length > 0
    },
    hasAbilities() {
      return this.abilities && this.abilities.length > 0
    },
    hasEquipment() {
      return this.equipment && this.equipment.length > 0
    },
    expansion() {
      if (!this.localConcept.expansion) return null
      return this.expansions.find(e => e.id === this.localConcept.expansion) || null
    },
    expansionLogoUrl() {
      return this.expansion && this.expansion.logoUrl ? this.expansion.logoUrl : ''
    },
    sortedAbilities() {
      // Sort by XP (ascending), then by name (A-Z)
      return [...this.abilities].sort((a, b) => {
        const xpA = a.xp ?? 0;
        const xpB = b.xp ?? 0;
        if (xpA !== xpB) return xpA - xpB;
        return (a.name || '').localeCompare(b.name || '');
      });
    },
  },
  methods: {
    toggleEditMode() {
      if (this.isEditMode) {
        if (this.isEditingTitle) this.saveTitleChanges();
        if (this.isEditingDescription) this.saveDescriptionChanges();
        this.emitUpdateEvent();
      }
      this.isEditMode = !this.isEditMode;
      this.$emit('edit-mode-change', this.isEditMode);
    },

    emitUpdateEvent() {
      try {
        // Create a clean copy excluding methods and non-data properties
        const cleanConcept = {
          ...this.localConcept,

          // Handle arrays properly
          artUrls: [...(this.localConcept.artUrls || [])],
          faces: [...(this.localConcept.faces || [])],
          places: [...(this.localConcept.places || [])],

          // Process hooks and playlists to extract only necessary properties
          hooks:
            this.localConcept.hooks?.map(
              ({ id, name, description, gmNotes }) => ({
                id,
                name,
                description,
                gmNotes,
              }),
            ) || [],
          playlists:
            this.localConcept.playlists?.map(({ service, embedCode }) => ({
              service,
              embedCode,
            })) || [],
        }

        this.$emit('update', cleanConcept)
      } catch (error) {
        console.error('Error in emitUpdateEvent:', error)
      }
    },

    closeModal() {
      try {
        // Check if any editing is in progress
        if (this.isEditingTitle || this.isEditingDescription) {
          if (
            confirm('You have unsaved changes. Are you sure you want to exit?')
          ) {
            // Don't emit an update when closing - just close
            this.$emit('close')
          }
          // If they cancel, do nothing (keep modal open)
        } else {
          // Just close without emitting update
          this.$emit('close')
        }
      } catch (error) {
        console.error('Error in closeDetailView:', error)
        // Still close the modal even if there was an error
        this.$emit('close')
      }
    },

    // Title editing
    startTitleEdit() {
      if (!this.isEditMode) return
      this.isEditingTitle = true
      this.backupConcept = { name: this.localConcept.name }
      this.$nextTick(() => {
        this.$refs.titleInput.focus()
        this.$refs.titleInput.select()
      })
    },

    saveTitleChanges() {
      this.isEditingTitle = false
      this.emitUpdateEvent()
    },

    cancelTitleEdit() {
      this.localConcept.name = this.backupConcept.name
      this.isEditingTitle = false
    },

    // Description editing
    startDescriptionEdit() {
      if (!this.isEditMode) return
      this.isEditingDescription = true
      this.backupConcept = { description: this.localConcept.description }
    },

    saveDescriptionChanges() {
      this.isEditingDescription = false
      this.emitUpdateEvent()
    },

    cancelDescriptionEdit() {
      this.localConcept.description = this.backupConcept.description
      this.isEditingDescription = false
    },

    // Fetch sources for backdrop images
    async fetchSources() {
      try {
        // Fetch all source types in parallel
        const [ancestries, cultures, mestieri, worldElements] = await Promise.all([
          AncestryService.getAllAncestries(),
          CultureService.getAllCultures(),
          MestiereService.getAllMestieri(),
          WorldElementService.getAllWorldElements()
        ]);

        // Update sources
        this.sources = {
          ancestries,
          cultures,
          mestieri,
          worldElements
        };

        // Also update the stores to ensure consistency
        this.abilitiesStore.sources = this.sources;
        this.equipmentStore.sources = this.sources;
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    },

    // Abilities and Equipment
    async fetchAbilities() {
      try {
        const abilities = await AbilityService.getAllAbilities()
        this.abilities = abilities.filter(
          (ability) => ability.source === this.localConcept.id,
        )
      } catch (error) {
        console.error('Error fetching abilities:', error)
      }
    },

    async fetchEquipment() {
      try {
        const equipment = await EquipmentService.getAllEquipment()
        this.equipment = equipment.filter(
          (item) => item.source === this.localConcept.id,
        )
      } catch (error) {
        console.error('Error fetching equipment:', error)
      }
    },

    emitAbilityEdit(ability) {
      if (!this.isEditMode) return
      this.$emit('edit-ability', ability)
    },

    emitEquipmentEdit(equipment) {
      if (!this.isEditMode) return
      this.$emit('edit-equipment', equipment)
    },

    /* Image Galleries: Featured, Faces, Places */
    updateFeaturedArt(newImages) {
      try {
        this.localConcept.artUrls = [...newImages]
        this.$nextTick(() => {
          this.emitUpdateEvent()
        })
      } catch (error) {
        console.error('Error updating art URLs:', error)
      }
    },

    updateFaces(newImages) {
      try {
        this.localConcept.faces = [...newImages]
        this.$nextTick(() => {
          this.emitUpdateEvent()
        })
      } catch (error) {
        console.error('Error updating faces:', error)
      }
    },

    updatePlaces(newImages) {
      try {
        this.localConcept.places = [...newImages]
        this.$nextTick(() => {
          this.emitUpdateEvent()
        })
      } catch (error) {
        console.error('Error updating places:', error)
      }
    },

    /* Playlists */
    updatePlaylists(newPlaylists) {
      try {
        this.localConcept.playlists = [...newPlaylists]
        this.$nextTick(() => {
          this.emitUpdateEvent()
        })
      } catch (error) {
        console.error('Error updating playlists:', error)
      }
    },

    ensureAppleEmbedHasDarkTheme() {
      this.localConcept.playlists.forEach((playlist) => {
        if (playlist.service === 'apple' && playlist.embedCode) {
          const srcMatch = playlist.embedCode.match(/src="([^"]+)"/)
          if (srcMatch && srcMatch[1]) {
            const originalSrc = srcMatch[1]
            const newSrc =
              originalSrc +
              (originalSrc.includes('?') ? '&theme=dark' : '?theme=dark')
            playlist.embedCode = playlist.embedCode
              .replace(`src="${originalSrc}"`, `src="${newSrc}"`)
              .replace(`src='${originalSrc}'`, `src='${newSrc}'`)
          }
        }
      })
    },

    /* Local Flavor */
    updateLocalFlavor(data) {
      this.localConcept.names = data.names
      this.localConcept.occupations = data.occupations
      this.localConcept.publicHouses = data.publicHouses
      this.localConcept.vittles = data.vittles
      this.localConcept.pointsOfInterest = data.pointsOfInterest
      this.localConcept.floraFauna = data.floraFauna
      this.emitUpdateEvent()
    },

    /* Hooks */
    updateHooks(newHooks) {
      try {
        this.localConcept.hooks = [...newHooks]
        this.$nextTick(() => {
          this.emitUpdateEvent()
        })
      } catch (error) {
        console.error('Error updating hooks:', error)
      }
    },

    /* Settings Modal */
    openSettingsModal() {
      this.tempSettings = {
        backgroundImage: this.localConcept.backgroundImage || '',
        color1: this.localConcept.color1 || '#ffffff',
        color2: this.localConcept.color2 || '#000000',
        expansionId: this.localConcept.expansion || '',
        expansion: this.localConcept.expansion || '',
      }
      this.showSettingsModal = true
    },

    closeSettingsModal() {
      this.showSettingsModal = false
    },

    saveSettings() {
      this.localConcept.backgroundImage = this.tempSettings.backgroundImage
      this.localConcept.color1 = this.tempSettings.color1
      this.localConcept.color2 = this.tempSettings.color2
      this.localConcept.expansion = this.tempSettings.expansionId
      this.emitUpdateEvent()
      this.closeSettingsModal()
    },
  },

  async mounted() {
    try {
      // Fetch expansions for badge
      await this.expansionStore.fetchExpansions()
      this.expansions = this.expansionStore.expansions

      // Fetch sources first so background images are available
      await this.fetchSources();

      // Then fetch abilities and equipment in parallel
      await Promise.all([
        this.fetchAbilities(),
        this.fetchEquipment()
      ]);
    } catch (error) {
      console.error('Error initializing ConceptDetailModal:', error);
    }
  },
})
</script>

<style scoped>
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

.edit-field-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
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
  overflow: auto;
  max-height: 90vh;
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
</style>
