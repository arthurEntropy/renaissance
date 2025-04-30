<template>
  <div class="modal-overlay" @click.self="closeDetailView">
    <div class="modal-content">
      <!-- Mode toggle button -->
      <div class="modal-controls">
        <button 
          class="mode-toggle-button" 
          @click="toggleEditMode" 
          :title="isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        >
          {{ isEditMode ? '✓ Save' : '✎ Edit' }}
        </button>
        <button 
          v-if="isEditMode"
          class="settings-button" 
          @click="openStyleSettings" 
          title="Card Style Settings"
        >⚙️</button>
      </div>

      <div class="concept-detail-content">
        <!-- Left: Art & Faces -->
        <div class="concept-info">
          <!-- Main Art Section -->
          <ImageGallery
            v-if="localConcept.artUrls && localConcept.artUrls.length"
            :images="localConcept.artUrls"
            :editable="isEditMode"
            :grid-columns="5"
            @update:images="updateArtUrls"
          />

          <!-- FACES SECTION -->
          <div class="concept-faces">
            <h2 class="section-header">Faces</h2>
            <ImageGallery
              :images="localConcept.faces || []"
              :editable="isEditMode"
              :grid-columns="5"
              @update:images="updateFaces"
            />
          </div>
          
          <!-- PLACES SECTION -->
          <div class="concept-faces">
            <h2 class="section-header">Places</h2>
            <ImageGallery
              :images="localConcept.places || []"
              :editable="isEditMode" 
              :grid-columns="5"
              @update:images="updatePlaces"
            />
          </div>

          <!-- PLAYLISTS SECTION -->
          <div class="concept-section">
            <h2 class="section-header">
              Playlists
              <button v-if="isEditMode" class="edit-section-button" @click="togglePlaylistEditing" title="Edit playlists">✎</button>
            </h2>
            
            <!-- Playlist Editor -->
            <div v-if="editingPlaylists" class="playlist-editor">
              <p class="helper-text">Paste embed codes from Spotify or Apple Music</p>
              <div class="url-container">
                <div
                  v-for="(playlist, idx) in localConcept.playlists"
                  :key="'playlist-' + idx"
                  class="playlist-item url-item"
                >
                  <div class="playlist-service-selector">
                    <select v-model="playlist.service" class="service-select">
                      <option value="spotify">Spotify</option>
                      <option value="apple">Apple Music</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    v-model="playlist.embedCode"
                    class="modal-input playlist-input"
                    placeholder="Paste embed code"
                  />
                  <div class="url-buttons">
                    <button type="button" class="button small" @click="movePlaylist(idx, -1)" :disabled="idx === 0" title="Move Up">▲</button>
                    <button type="button" class="button small" @click="movePlaylist(idx, 1)" :disabled="idx === localConcept.playlists.length - 1" title="Move Down">▼</button>
                    <button type="button" class="button button-danger small" @click="removePlaylist(idx)">✕</button>
                  </div>
                </div>
              </div>
              <div class="playlist-editor-buttons">
                <button type="button" class="button button-primary small" @click="addPlaylist">Add Playlist</button>
                <button type="button" class="button small" @click="savePlaylistChanges">Done</button>
              </div>
            </div>
          
            <!-- Service Toggle (when not editing) -->
            <div v-else>
              <div class="playlist-toggle">
                <button 
                  class="playlist-toggle-btn" 
                  :class="{ active: playlistService === 'spotify' }" 
                  @click="playlistService = 'spotify'"
                >
                  <i class="fa fa-spotify"></i> Spotify
                </button>
                <button 
                  class="playlist-toggle-btn" 
                  :class="{ active: playlistService === 'apple' }" 
                  @click="playlistService = 'apple'"
                >
                  <i class="fa fa-music"></i> Apple Music
                </button>
              </div>
              
              <!-- Playlist Embeds -->
              <div class="playlist-container">
                <div 
                  v-for="(playlist, index) in filteredPlaylists" 
                  :key="`playlist-${index}`"
                  class="playlist-embed"
                  v-html="playlist.embedCode"
                ></div>
                <div v-if="filteredPlaylists.length === 0" class="no-playlists">
                  No {{ playlistService === 'spotify' ? 'Spotify' : 'Apple Music' }} playlists available.
                  <span v-if="hasOtherServicePlaylists">
                    Try switching to {{ playlistService === 'spotify' ? 'Apple Music' : 'Spotify' }}.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Header, Description, Abilities, Names, Hooks & Equipment -->
        <div class="concept-main-column">
          <!-- Header -->
          <div class="concept-header-container">
            <div v-if="editingTitle" class="editable-title">
              <input 
                type="text" 
                v-model="localConcept.name" 
                class="concept-title-input"
                ref="titleInput"
                @blur="saveTitleChanges"
                @keyup.enter="saveTitleChanges"
                @keyup.esc="cancelTitleEdit"
              />
            </div>
            <h1 v-else class="concept-header" @click="isEditMode && startTitleEdit">
              {{ localConcept.name }}
              <span v-if="isEditMode" class="edit-indicator" title="Click to edit">✎</span>
            </h1>
          </div>
          
          <!-- Description -->
          <div class="description-container">
            <div v-if="editingDescription" class="editable-description">
              <text-editor
                v-model="localConcept.description" 
                height="200px"
                ref="descriptionEditor"
              />
              <div class="edit-field-buttons">
                <button class="button small" @click="saveDescriptionChanges">Save</button>
                <button class="button small" @click="cancelDescriptionEdit">Cancel</button>
              </div>
            </div>
            <div v-else class="concept-description" @click="isEditMode && startDescriptionEdit" v-html="localConcept.description">
            </div>
            <span v-if="isEditMode && !editingDescription" class="edit-field-indicator" @click="startDescriptionEdit" title="Edit description">✎</span>
          </div>
          
          <!-- Traits & Abilities -->
          <div class="concept-section" v-if="abilities.length > 0">
            <h2 class="section-header">Traits & Abilities</h2>
            <masonry-grid 
              :column-width="350" 
              :gap="10" 
              :row-height="10"
              class="ability-cards-container"
            >
              <AbilityCard
                v-for="ability in abilities"
                :key="ability.id"
                :ability="ability"
                :editable="isEditMode"
                @edit="emitAbilityEdit"
              />
            </masonry-grid>
          </div>

          <!-- LOCAL FLAVOR SECTION -->
          <div class="concept-section">
            <h2 class="section-header">
              Local Flavor
              <button v-if="isEditMode" class="edit-section-button" @click="toggleReferenceEditing" title="Edit local flavor">✎</button>
            </h2>
            
            <!-- Edit mode for reference data -->
            <div v-if="editingReference" class="reference-editor">
              <div class="reference-edit-grid">
                <!-- Names -->
                <div class="reference-edit-item">
                  <label for="names">Names</label>
                  <textarea
                    id="names"
                    v-model="localConcept.names"
                    class="modal-input reference-textarea"
                    placeholder="Who might you meet?"
                  ></textarea>
                </div>
                
                <!-- Occupations -->
                <div class="reference-edit-item">
                  <label for="occupations">Occupations</label>
                  <textarea
                    id="occupations"
                    v-model="localConcept.occupations"
                    class="modal-input reference-textarea"
                    placeholder="What do people do around here?"
                  ></textarea>
                </div>
                
                <!-- Public Houses -->
                <div class="reference-edit-item">
                  <label for="publicHouses">Public Houses</label>
                  <textarea
                    id="publicHouses"
                    v-model="localConcept.publicHouses"
                    class="modal-input reference-textarea"
                    placeholder="Where can a traveler find hospitality?"
                  ></textarea>
                </div>
                
                <!-- Vittles -->
                <div class="reference-edit-item">
                  <label for="vittles">Vittles</label>
                  <textarea
                    id="vittles"
                    v-model="localConcept.vittles"
                    class="modal-input reference-textarea"
                    placeholder="What's on the menu?"
                  ></textarea>
                </div>
                
                <!-- Points of Interest -->
                <div class="reference-edit-item">
                  <label for="pointsOfInterest">Points of Interest</label>
                  <textarea
                    id="pointsOfInterest"
                    v-model="localConcept.pointsOfInterest"
                    class="modal-input reference-textarea"
                    placeholder="What are the must-see spots?"
                  ></textarea>
                </div>
                
                <!-- Flora & Fauna -->
                <div class="reference-edit-item">
                  <label for="floraFauna">Flora & Fauna</label>
                  <textarea
                    id="floraFauna"
                    v-model="localConcept.floraFauna"
                    class="modal-input reference-textarea"
                    placeholder="What can be found in the wild?"
                  ></textarea>
                </div>
              </div>
              
              <div class="edit-field-buttons">
                <button class="button small" @click="saveReferenceChanges">Save</button>
                <button class="button small" @click="cancelReferenceEdit">Cancel</button>
              </div>
            </div>
            
            <!-- Display mode for reference data -->
            <div v-else class="reference-grid">
              <!-- Names -->
              <div class="reference-card" v-if="localConcept.names">
                <div class="reference-title">Names</div>
                <div class="reference-content">
                  {{ localConcept.names }}
                </div>
              </div>
              
              <!-- Occupations -->
              <div class="reference-card" v-if="localConcept.occupations">
                <div class="reference-title">Occupations</div>
                <div class="reference-content">
                  {{ localConcept.occupations }}
                </div>
              </div>
              
              <!-- Public Houses -->
              <div class="reference-card" v-if="localConcept.publicHouses">
                <div class="reference-title">Public Houses</div>
                <div class="reference-content">
                  {{ localConcept.publicHouses }}
                </div>
              </div>
              
              <!-- Vittles -->
              <div class="reference-card" v-if="localConcept.vittles">
                <div class="reference-title">Vittles</div>
                <div class="reference-content">
                  {{ localConcept.vittles }}
                </div>
              </div>

              <!-- Points of Interest-->
              <div class="reference-card" v-if="localConcept.pointsOfInterest">
                <div class="reference-title">Points of Interest</div>
                <div class="reference-content">
                  {{ localConcept.pointsOfInterest }}
                </div>
              </div>

              <!-- Flora & Fauna -->
              <div class="reference-card" v-if="localConcept.floraFauna">
                <div class="reference-title">Flora & Fauna</div>
                <div class="reference-content">
                  {{ localConcept.floraFauna }}
                </div>
              </div>
            </div>
          </div>

          <!-- HOOKS SECTION -->
          <div class="concept-section">
            <h2 class="section-header">
              Hooks
              <button v-if="isEditMode" class="edit-section-button" @click="toggleHooksEditing" title="Edit hooks">✎</button>
            </h2>
            
            <!-- Edit mode for hooks -->
            <div v-if="editingHooks" class="hooks-editor">
              <draggable 
                v-model="localConcept.hooks" 
                item-key="id" 
                handle=".drag-handle"
                animation="200"
                ghost-class="ghost-hook"
                @end="saveHooksOrder"
              >
                <template #item="{ element: hook, index: idx }">
                  <div class="hook-edit-card">
                    <!-- Hook header with drag handle, caret and name -->
                    <div class="hook-header">
                      <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                      <span 
                        class="hook-caret" 
                        @click="toggleHookExpansion(hook.id || idx)"
                      >
                        {{ isHookExpanded(hook.id || idx) ? '▼' : '►' }}
                      </span>
                      <input
                        type="text"
                        v-model="hook.name"
                        placeholder="Hook Name"
                        class="modal-input hook-input"
                      />
                    </div>
                    
                    <!-- Collapsible hook content -->
                    <div v-if="isHookExpanded(hook.id || idx)" class="hook-fields">
                      <div class="hook-field">
                        <label>Description:</label>
                        <text-editor
                          v-model="hook.description"
                          placeholder="Description of the hook..."
                          height="120px"
                          :readonly="!isEditMode"
                        />
                      </div>

                      <div class="hook-field">
                        <label>GM Notes:</label>
                        <text-editor
                          v-model="hook.gmNotes"
                          placeholder="Notes only visible to the GM..."
                          height="120px"
                          :readonly="!isEditMode"
                        />
                      </div>

                      <div class="delete-hook-container">
                        <button type="button" class="button button-danger small delete-hook-btn" @click="removeHook(idx)">Delete Hook</button>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
              
              <div class="hooks-editor-buttons">
                <button type="button" class="button button-primary small" @click="addHook">Add Hook</button>
                <button type="button" class="button small" @click="saveHooksChanges">Done</button>
              </div>
            </div>
            
            <!-- Display mode for hooks -->
            <div v-else>
              <div
                v-for="hook in localConcept.hooks"
                :key="hook.id"
                class="info-card"
              >
                <div class="hook-name">{{ hook.name }}</div>
                <div class="hook-description" v-html="hook.description"></div>
                <button
                  class="toggle-gm-notes"
                  @click="toggleGMNotes(hook.id)"
                >
                  {{ shownGMNotes && shownGMNotes[hook.id] ? 'Hide GM Notes' : 'View GM Notes' }}
                </button>
                <div
                  v-if="shownGMNotes && shownGMNotes[hook.id]"
                  class="hook-gm-notes"
                  v-html="hook.gmNotes"
                ></div>
              </div>
            </div>
          </div>
          
          <!-- Equipment/Wares -->
          <div class="concept-section" v-if="equipment.length > 0">
            <h2 class="section-header">Wares</h2>
            <masonry-grid 
              :column-width="350" 
              :gap="10" 
              :row-height="10"
              class="equipment-cards-container"
            >
              <EquipmentCard
                v-for="item in equipment"
                :key="item.id"
                :equipment="item"
                :editable="isEditMode"
                @edit="emitEquipmentEdit"
              />
            </masonry-grid>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Style Settings Modal -->
  <div v-if="showStyleSettings" class="modal-overlay" @click.self="closeStyleSettings">
    <div class="modal-content style-settings-modal">
      <h3>Card Style Settings</h3>
      
      <!-- Background Image URL -->
      <div class="form-group vertical">
        <label for="backgroundImage">Background Image URL:</label>
        <input
          type="text"
          id="backgroundImage"
          v-model="tempStyleSettings.backgroundImage"
          class="modal-input"
          placeholder="https://example.com/image.png"
        />
      </div>

      <!-- Colors -->
      <div class="form-group">
        <label for="color1">Primary Color:</label>
        <input type="color" id="color1" v-model="tempStyleSettings.color1" />
        <label for="color2">Secondary Color:</label>
        <input type="color" id="color2" v-model="tempStyleSettings.color2" />
      </div>
      
      <div class="settings-buttons">
        <button type="button" class="button" @click="closeStyleSettings">Cancel</button>
        <button type="button" class="button button-primary" @click="saveStyleSettings">Save</button>
      </div>
    </div>
  </div>
</template>
  
<script>
import AbilityService from "@/services/AbilityService";
import EquipmentService from "@/services/EquipmentService";
import AbilityCard from "@/components/AbilityCard.vue";
import EquipmentCard from "@/components/EquipmentCard.vue";
import ImageGallery from "@/components/ImageGallery.vue";
import MasonryGrid from "@/components/MasonryGrid.vue";
import TextEditor from '@/components/TextEditor.vue';
import { defineComponent } from 'vue';
import draggable from 'vuedraggable';

export default defineComponent({
  props: {
    concept: {
      type: Object,
      required: true,
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  components: {
    AbilityCard,
    EquipmentCard,
    ImageGallery,
    MasonryGrid,
    TextEditor,
    draggable,
  },
  emits: ['close', 'update', 'edit-ability', 'edit-equipment'],
  data() {
    return {
      abilities: [],
      equipment: [],
      shownGMNotes: {},
      playlistService: 'apple',
      localConcept: {},
      isEditMode: false,
      
      // Individual editing states
      editingTitle: false,
      editingDescription: false,
      editingReference: false,
      editingHooks: false,
      editingPlaylists: false,
      
      // For hook expansion
      expandedHooks: {},
      
      // For undo functionality
      backupConcept: null,

      showStyleSettings: false,
      tempStyleSettings: {
        backgroundImage: '',
        color1: '#ffffff',
        color2: '#000000'
      },
    };
  },
  watch: {
    concept: {
      immediate: true,
      handler(newConcept) {
        // Create a deep copy of the concept to avoid direct mutation
        this.localConcept = JSON.parse(JSON.stringify(newConcept));
        
        // Ensure all arrays exist to avoid null/undefined errors
        this.localConcept.hooks = this.localConcept.hooks || [];
        this.localConcept.playlists = this.localConcept.playlists || [];
        this.localConcept.artUrls = this.localConcept.artUrls || [];
        this.localConcept.faces = this.localConcept.faces || [];
        this.localConcept.places = this.localConcept.places || [];
        
        // Refresh abilities and equipment when concept changes
        this.fetchAbilities();
        this.fetchEquipment();
      }
    },
    editable: {
      handler(newValue) {
        this.isEditMode = newValue;
      },
      immediate: true
    }
  },
  computed: {
    hasReferenceData() {
      return this.localConcept.names || 
             this.localConcept.occupations || 
             this.localConcept.publicHouses || 
             this.localConcept.vittles ||
             this.localConcept.pointsOfInterest ||
             this.localConcept.floraFauna;
    },

    hasPlaylists() {
      return this.localConcept.playlists && this.localConcept.playlists.length > 0;
    },
    
    filteredPlaylists() {
      if (!this.localConcept.playlists) return [];
      return this.localConcept.playlists.filter(playlist => 
        playlist.service === this.playlistService
      );
    },
    
    hasOtherServicePlaylists() {
      if (!this.localConcept.playlists) return false;
      const otherService = this.playlistService === 'spotify' ? 'apple' : 'spotify';
      return this.localConcept.playlists.some(p => p.service === otherService);
    }
  },
  methods: {
    toggleEditMode() {
      // If turning off edit mode, save changes
      if (this.isEditMode) {
        // Save any open editors
        if (this.editingTitle) this.saveTitleChanges();
        if (this.editingDescription) this.saveDescriptionChanges();
        if (this.editingReference) this.saveReferenceChanges();
        if (this.editingHooks) this.saveHooksChanges();
        if (this.editingPlaylists) this.savePlaylistChanges();
        
        // Emit update with current state
        this.emitUpdateEvent();
      }
      
      // Toggle edit mode
      this.isEditMode = !this.isEditMode;
      
      // Emit event to parent
      this.$emit('edit-mode-change', this.isEditMode);
    },
    
    // Title editing
    startTitleEdit() {
      if (!this.isEditMode) return;
      this.editingTitle = true;
      this.backupConcept = { name: this.localConcept.name };
      this.$nextTick(() => {
        this.$refs.titleInput.focus();
        this.$refs.titleInput.select();
      });
    },
    
    saveTitleChanges() {
      this.editingTitle = false;
      this.emitUpdateEvent();
    },
    
    cancelTitleEdit() {
      this.localConcept.name = this.backupConcept.name;
      this.editingTitle = false;
    },
    
    // Description editing
    startDescriptionEdit() {
      if (!this.isEditMode) return;
      this.editingDescription = true;
      this.backupConcept = { description: this.localConcept.description };
    },
    
    saveDescriptionChanges() {
      this.editingDescription = false;
      this.emitUpdateEvent();
    },
    
    cancelDescriptionEdit() {
      this.localConcept.description = this.backupConcept.description;
      this.editingDescription = false;
    },
    
    // Reference (Local Flavor) editing
    toggleReferenceEditing() {
      if (!this.isEditMode) return;
      if (!this.editingReference) {
        // Starting to edit - backup current values
        this.backupConcept = {
          names: this.localConcept.names,
          occupations: this.localConcept.occupations,
          publicHouses: this.localConcept.publicHouses,
          vittles: this.localConcept.vittles,
          pointsOfInterest: this.localConcept.pointsOfInterest,
          floraFauna: this.localConcept.floraFauna
        };
      }
      this.editingReference = !this.editingReference;
    },
    
    saveReferenceChanges() {
      this.editingReference = false;
      this.emitUpdateEvent();
    },
    
    cancelReferenceEdit() {
      // Restore from backup
      this.localConcept.names = this.backupConcept.names;
      this.localConcept.occupations = this.backupConcept.occupations;
      this.localConcept.publicHouses = this.backupConcept.publicHouses;
      this.localConcept.vittles = this.backupConcept.vittles;
      this.localConcept.pointsOfInterest = this.backupConcept.pointsOfInterest;
      this.localConcept.floraFauna = this.backupConcept.floraFauna;
      this.editingReference = false;
    },
    
    // Hooks editing
    toggleHooksEditing() {
      if (!this.isEditMode) return;
      if (!this.editingHooks) {
        // Starting to edit - backup current hooks
        this.backupConcept = { hooks: JSON.parse(JSON.stringify(this.localConcept.hooks)) };
      }
      this.editingHooks = !this.editingHooks;
    },
    
    saveHooksOrder(event) {
      // Force clean update after drag completes
      this.$nextTick(() => {
        // Only emit if we actually moved something
        if (event.oldIndex !== event.newIndex) {
          this.emitUpdateEvent();
        }
      });
    },
    
    saveHooksChanges() {
      this.editingHooks = false;
      // Force a clean update when editing is done
      this.$nextTick(() => {
        this.emitUpdateEvent();
      });
    },
    
    cancelHooksEdit() {
      // Restore from backup
      this.localConcept.hooks = this.backupConcept.hooks;
      this.editingHooks = false;
    },
    
    toggleHookExpansion(hookId) {
      this.expandedHooks[hookId] = !this.expandedHooks[hookId];
    },
    
    isHookExpanded(hookId) {
      return !!this.expandedHooks[hookId];
    },

    addHook() {
      const hookId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      this.localConcept.hooks.push({
        id: hookId,
        name: "",
        description: "",
        gmNotes: ""
      });
      this.expandedHooks[hookId] = true;
    },

    removeHook(idx) {
      this.localConcept.hooks.splice(idx, 1);
    },
    
    toggleGMNotes(hookId) {
      this.shownGMNotes[hookId] = !this.shownGMNotes[hookId];
    },
    
    // Playlist editing
    togglePlaylistEditing() {
      if (!this.isEditMode) return;
      if (!this.editingPlaylists) {
        // Starting to edit - backup current playlists
        this.backupConcept = { playlists: JSON.parse(JSON.stringify(this.localConcept.playlists || [])) };
      }
      this.editingPlaylists = !this.editingPlaylists;
    },
    
    savePlaylistChanges() {
      // Process Apple Music embed codes to ensure dark theme
      this.processAppleEmbedCodes();
      
      this.editingPlaylists = false;
      this.emitUpdateEvent();
    },
    
    cancelPlaylistEdit() {
      // Restore from backup
      this.localConcept.playlists = this.backupConcept.playlists;
      this.editingPlaylists = false;
    },
    
    addPlaylist() {
      if (!this.localConcept.playlists) {
        this.localConcept.playlists = [];
      }
      this.localConcept.playlists.push({
        service: 'spotify',
        embedCode: ''
      });
    },
    
    removePlaylist(idx) {
      this.localConcept.playlists.splice(idx, 1);
    },
    
    movePlaylist(idx, direction) {
      const playlists = this.localConcept.playlists;
      const newIdx = idx + direction;
      if (newIdx >= 0 && newIdx < playlists.length) {
        [playlists[idx], playlists[newIdx]] = [playlists[newIdx], playlists[idx]];
      }
    },
    
    // Abilities and Equipment
    async fetchAbilities() {
      try {
        const abilities = await AbilityService.getAllAbilities();
        this.abilities = abilities.filter(
          (ability) => ability.source === this.localConcept.id
        );
        console.log(`Fetched ${this.abilities.length} abilities for concept ${this.localConcept.id}`);
      } catch (error) {
        console.error("Error fetching abilities:", error);
      }
    },
    
    async fetchEquipment() {
      try {
        const equipment = await EquipmentService.getAllEquipment();
        this.equipment = equipment.filter(
          (item) => item.source === this.localConcept.id
        );
        console.log(`Fetched ${this.equipment.length} equipment items for concept ${this.localConcept.id}`);
      } catch (error) {
        console.error("Error fetching equipment:", error);
      }
    },
    
    emitAbilityEdit(ability) {
      if (!this.isEditMode) return;
      this.$emit("edit-ability", ability);
    },
    
    emitEquipmentEdit(equipment) {
      if (!this.isEditMode) return;
      this.$emit("edit-equipment", equipment);
    },
    
    // A more robust emitUpdateEvent that handles errors
    emitUpdateEvent() {
      try {
        // Create a clean copy without DOM references or circular structures
        const cleanConcept = {
          id: this.localConcept.id,
          name: this.localConcept.name,
          description: this.localConcept.description,
          // Include only the array data, not DOM references
          artUrls: this.localConcept.artUrls ? [...this.localConcept.artUrls] : [],
          faces: this.localConcept.faces ? [...this.localConcept.faces] : [],
          places: this.localConcept.places ? [...this.localConcept.places] : [],
          // For hooks, take only the specific properties we need
          hooks: this.localConcept.hooks ? this.localConcept.hooks.map(hook => ({
            id: hook.id,
            name: hook.name,
            description: hook.description,
            gmNotes: hook.gmNotes
          })) : [],
          playlists: this.localConcept.playlists ? this.localConcept.playlists.map(playlist => ({
            service: playlist.service,
            embedCode: playlist.embedCode
          })) : [],
          // Copy other primitive fields
          names: this.localConcept.names,
          occupations: this.localConcept.occupations,
          publicHouses: this.localConcept.publicHouses,
          vittles: this.localConcept.vittles,
          pointsOfInterest: this.localConcept.pointsOfInterest,
          floraFauna: this.localConcept.floraFauna,
          // Preserve styling fields
          backgroundImage: this.localConcept.backgroundImage,
          color1: this.localConcept.color1,
          color2: this.localConcept.color2,
          // Include any other fields your concept might have
          isDeleted: this.localConcept.isDeleted
        };
        
        // Emit the clean object directly
        this.$emit('update', cleanConcept);
      } catch (error) {
        console.error("Error in emitUpdateEvent:", error);
      }
    },
    
    // Make updateArtUrls safer
    updateArtUrls(newImages) {
      try {
        // Make a clean copy
        this.localConcept.artUrls = [...newImages];
        // Emit update after a nextTick to let Vue's reactivity settle
        this.$nextTick(() => {
          this.emitUpdateEvent();
        });
      } catch (error) {
        console.error("Error updating art URLs:", error);
      }
    },
    
    // Similarly update the other image update methods
    updateFaces(newImages) {
      try {
        this.localConcept.faces = [...newImages];
        this.$nextTick(() => {
          this.emitUpdateEvent();
        });
      } catch (error) {
        console.error("Error updating faces:", error);
      }
    },
    
    updatePlaces(newImages) {
      try {
        this.localConcept.places = [...newImages];
        this.$nextTick(() => {
          this.emitUpdateEvent();
        });
      } catch (error) {
        console.error("Error updating places:", error);
      }
    },
    
    processAppleEmbedCodes() {
      // Function to ensure dark theme is set for Apple Music embeds
      this.localConcept.playlists.forEach(playlist => {
        if (playlist.service === 'apple' && playlist.embedCode) {
          // Extract the src attribute
          const srcMatch = playlist.embedCode.match(/src="([^"]+)"/);
          if (srcMatch && srcMatch[1]) {
            const originalSrc = srcMatch[1];
            
            // Add dark theme parameter if not already present
            const newSrc = originalSrc + (originalSrc.includes('?') ? '&theme=dark' : '?theme=dark');
            
            // Replace the src in the embed code
            playlist.embedCode = playlist.embedCode.replace(
              `src="${originalSrc}"`, 
              `src="${newSrc}"`
            ).replace(
              `src='${originalSrc}'`,
              `src='${newSrc}'`
            );
          }
        }
      });
    },

    openStyleSettings() {
      // Copy current values to the temp object
      this.tempStyleSettings = {
        backgroundImage: this.localConcept.backgroundImage || '',
        color1: this.localConcept.color1 || '#ffffff',
        color2: this.localConcept.color2 || '#000000'
      };
      this.showStyleSettings = true;
    },

    closeStyleSettings() {
      this.showStyleSettings = false;
    },

    saveStyleSettings() {
      // Update the local concept with the new settings
      this.localConcept.backgroundImage = this.tempStyleSettings.backgroundImage;
      this.localConcept.color1 = this.tempStyleSettings.color1;
      this.localConcept.color2 = this.tempStyleSettings.color2;
      
      // Emit the update
      this.emitUpdateEvent();
      
      // Close the settings modal
      this.closeStyleSettings();
    },
    
    closeDetailView() {
      try {
        // Check if any editing is in progress
        if (this.editingTitle || this.editingDescription || 
            this.editingReference || this.editingHooks || this.editingPlaylists) {
          if (confirm("You have unsaved changes. Are you sure you want to exit?")) {
            // Don't emit an update when closing - just close
            this.$emit("close");
          }
          // If they cancel, do nothing (keep modal open)
        } else {
          // Just close without emitting update
          this.$emit("close");
        }
      } catch (error) {
        console.error("Error in closeDetailView:", error);
        // Still close the modal even if there was an error
        this.$emit("close");
      }
    },
  },
  
  async mounted() {
    // We'll fetch abilities and equipment immediately on mount
    await Promise.all([this.fetchAbilities(), this.fetchEquipment()]);
  },
});
</script>
  
<style scoped>
/* Add this new style for the edit mode toggle button */
.modal-controls {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.mode-toggle-button {
  background: #4caf50;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  z-index: 10;
}

.mode-toggle-button:hover {
  background: #45a049;
}

.concept-detail-content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 40px;
  padding: 20px;
  color: white;
}

.concept-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: left;
  max-width: 500px;
  text-align: left;
}

.concept-main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 400px;
  max-width: 710px;
  gap: 1.5rem;
}

/* Concept header container */
.concept-header-container {
  display: flex;
  align-items: center;
  position: relative;
}

/* Concept header (the title) */
.concept-header {
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 10px;
  margin-bottom: 0;
  margin-top: 0;
  font-size: 3rem;
  cursor: pointer;
}

/* Edit indicators */
.edit-indicator {
  opacity: 0;
  font-size: 0.5em;
  margin-left: 8px;
  vertical-align: middle;
  transition: opacity 0.2s;
}

.concept-header:hover .edit-indicator {
  opacity: 0.7;
}

/* Title input */
.concept-title-input {
  font-size: 3rem;
  font-weight: bold;
  padding: 4px 8px;
  width: 100%;
  background: rgba(0,0,0,0.2);
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

.concept-description:hover {
  background-color: rgba(255, 255, 255, 0.05);
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

/* Edit section button */
.edit-section-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 0.7em;
  padding: 2px 6px;
  cursor: pointer;
  vertical-align: middle;
  margin-left: 8px;
  transition: color 0.2s;
}

.edit-section-button:hover {
  color: white;
}

/* Playlist editor */
.playlist-editor {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.playlist-editor-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: space-between;
}

/* URL containers and items */
.url-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.url-item {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid #444;
}

.url-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 5px;
}

/* Reference editor */
.reference-editor {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.reference-edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.reference-edit-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.reference-textarea {
  min-height: 80px;
  resize: vertical;
}

/* Hooks editor */
.hooks-editor {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.hooks-editor-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.hook-edit-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 8px;
}

.drag-handle {
  cursor: move;
  font-size: 1.2em;
  color: #777;
  margin-right: 8px;
  user-select: none;
}

.drag-handle:hover {
  color: #aaa;
}

.ghost-hook {
  opacity: 0.5;
  background: #2a2a2a !important;
  border: 2px dashed #555 !important;
}

.hook-header {
  display: flex;
  align-items: center;
  padding: 4px;
}

.hook-caret {
  cursor: pointer;
  padding: 4px 8px 4px 2px;
  user-select: none;
}

.hook-input {
  flex: 1;
  margin: 0;
}

.hook-fields {
  padding: 10px 10px 5px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hook-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.delete-hook-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
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
  color: white;
}

.ability-cards-container,
.equipment-cards-container {
  width: 100%;
  min-height: 50px;
}

.concept-faces {
  width: 100%;
  margin: 1.2rem 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.info-card {
  background: rgba(0,0,0,0.85);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.hook-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.hook-description {
  color: #e0e0e0;
  margin-bottom: 8px;
}

.toggle-gm-notes {
  background: none;
  border: 1px solid #888;
  color: #bbb;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 0.95em;
  cursor: pointer;
  margin-bottom: 6px;
  margin-top: 2px;
  transition: background 0.2s, color 0.2s;
}

.toggle-gm-notes:hover {
  background: #444;
  color: #fff;
}

.hook-gm-notes {
  background: rgba(60,60,80,0.85);
  color: #b0e0ff;
  border-radius: 4px;
  padding: 8px 10px;
  margin-top: 6px;
  font-size: 0.97em;
  white-space: pre-line;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

.reference-card {
  background: rgba(0,0,0,0.85);
  border-radius: 8px;
  padding: 12px 16px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.reference-title {
  font-weight: bold;
  color: #ffd700;
  font-size: 1.2rem;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 4px;
}

.reference-content {
  color: #e0e0e0;
  line-height: 1.4;
  white-space: pre-line;
  overflow-wrap: break-word;
  flex: 1;
}

.playlist-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.playlist-toggle-btn {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
  color: #aaa;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-toggle-btn.active {
  background: rgba(0, 0, 0, 0.8);
  border-color: #ffd700;
  color: white;
}

.playlist-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.playlist-embed {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.no-playlists {
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  text-align: center;
  color: #aaa;
}

.settings-button {
  position: absolute;
  top: 30px;
  right: 0;
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  padding: 5px;
  transition: color 0.2s ease;
}

.settings-button:hover {
  color: white;
}

.style-settings-modal {
  max-width: 500px;
  text-align: left;
}

.settings-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Make sure the modal content has position relative for absolute positioning */
.modal-content {
  position: relative;
}

/* For better color picker styling */
input[type="color"] {
  width: 50px;
  height: 30px;
  border: none;
  cursor: pointer;
  margin: 0 10px;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .concept-detail-content { 
    flex-direction: column; 
    gap: 18px; 
  }
  .concept-info { 
    max-width: 100%;
    margin-bottom: 1rem;
  }
  .concept-main-column { 
    max-width: 100%; 
  }
  .reference-edit-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .reference-grid {
    grid-template-columns: 1fr;
  }
}
</style>