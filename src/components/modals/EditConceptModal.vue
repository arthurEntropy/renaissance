<template>
  <div class="modal-overlay">
    <div class="modal-content" @scroll="handleScroll" ref="modalContent">
      <h2 class="modal-header">Edit Concept</h2>

      <!-- Two-column layout container -->
      <div class="two-column-layout">
        <!-- Left column - Main content -->
        <div class="left-column">
          <form>
            <!-- Name -->
            <div class="form-group vertical">
              <h3 class="section-label">Name</h3>
              <input type="text" id="name" v-model="editedConcept.name" class="modal-input" />
            </div>

            <!-- Description -->
            <div class="form-group vertical">
              <h3 class="section-label">Description</h3>
              <text-editor v-model="editedConcept.description" height="200px"
                placeholder="Enter concept description..." />
            </div>

            <h3 class="section-label">Local Flavor</h3>

            <!-- Names -->
            <label for="names">Names:</label>
            <textarea id="names" v-model="editedConcept.names" class="modal-input"
              placeholder="Who might you meet?"></textarea>

            <!-- Occupations-->
            <label for="occupations">Occupations:</label>
            <textarea id="occupations" v-model="editedConcept.occupations" class="modal-input"
              placeholder="What do people do around here?"></textarea>

            <!-- Public Houses-->
            <label for="publicHouses">Public Houses:</label>
            <textarea id="publicHouses" v-model="editedConcept.publicHouses" class="modal-input"
              placeholder="Where can a traveler find hospitality?"></textarea>

            <!-- Vittles-->
            <label for="vittles">Vittles:</label>
            <textarea id="vittles" v-model="editedConcept.vittles" class="modal-input"
              placeholder="What's on the menu?"></textarea>

            <!-- Points of Interest-->
            <label for="pointsOfInterest">Points of Interest:</label>
            <textarea id="pointsOfInterest" v-model="editedConcept.pointsOfInterest" class="modal-input"
              placeholder="What are the must-see spots?"></textarea>

            <!-- Flora & Fauna-->
            <label for="floraFauna">Flora & Fauna:</label>
            <textarea id="floraFauna" v-model="editedConcept.floraFauna" class="modal-input"
              placeholder="What can be found in the wild?"></textarea>

            <!-- Hooks -->
            <div class="form-group vertical">
              <h3 class="section-label">Hooks</h3>
              <div v-for="(hook, idx) in editedConcept.hooks" :key="hook.id || idx" class="hook-edit-card">
                <!-- Hook header with caret and name - everything on one row -->
                <div class="hook-header">
                  <span class="hook-caret" @click="toggleHookExpansion(hook.id || idx)">
                    {{ isHookExpanded(hook.id || idx) ? '▼' : '►' }}
                  </span>
                  <label for="hook-name" class="hook-label">Name:</label>
                  <input type="text" id="hook-name" v-model="hook.name" placeholder="Hook Name"
                    class="modal-input hook-input" />
                </div>

                <!-- Collapsible hook content -->
                <div v-if="isHookExpanded(hook.id || idx)" class="hook-fields">
                  <div class="hook-field">
                    <label class="hook-label">Description:</label>
                    <text-editor v-model="hook.description" placeholder="Description of the hook..." height="120px" />
                  </div>

                  <div class="hook-field">
                    <label class="hook-label">GM Notes:</label>
                    <text-editor v-model="hook.gmNotes" placeholder="Notes only visible to the GM..." height="120px" />
                  </div>

                  <div class="delete-hook-container">
                    <button type="button" class="button button-danger small delete-hook-btn" @click="removeHook(idx)">
                      Delete Hook
                    </button>
                  </div>
                </div>
              </div>
              <button type="button" class="button button-primary small" @click="addHook">
                Add Hook
              </button>
            </div>

            <h3 class="section-label">
              Ability & Equipment Card Background Style
            </h3>

            <!-- Background Image URL -->
            <div class="form-group vertical">
              <label for="backgroundImage">Background Image URL:</label>
              <input type="text" id="backgroundImage" v-model="editedConcept.backgroundImage" class="modal-input"
                placeholder="https://example.com/image.png" />
            </div>

            <!-- Colors -->
            <div class="form-group">
              <label for="color1">Primary Color:</label>
              <input type="color" id="color1" v-model="editedConcept.color1" />
              <label for="color2">Secondary Color:</label>
              <input type="color" id="color2" v-model="editedConcept.color2" />
            </div>
          </form>
        </div>

        <!-- Right column - Art URLs -->
        <div class="right-column">
          <!-- Art URLs -->
          <div class="form-group vertical">
            <h3 class="section-label">Featured Art URLs</h3>
            <div class="url-container">
              <div v-for="(url, idx) in editedConcept.artUrls" :key="'art-' + idx" class="url-item">
                <img v-if="url" :src="url" alt="Art thumbnail" class="url-thumb" />
                <input type="text" v-model="editedConcept.artUrls[idx]" class="modal-input url-input"
                  :placeholder="`Art URL #${idx + 1}`" />
                <div class="url-buttons">
                  <button type="button" class="button small" @click="moveArtUrl(idx, -1)" :disabled="idx === 0"
                    title="Move Up">
                    ▲
                  </button>
                  <button type="button" class="button small" @click="moveArtUrl(idx, 1)"
                    :disabled="idx === editedConcept.artUrls.length - 1" title="Move Down">
                    ▼
                  </button>
                  <button type="button" class="button button-danger small" @click="removeArtUrl(idx)">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <button type="button" class="button button-primary small" @click="addArtUrl">
              Add Art URL
            </button>
          </div>

          <!-- Faces URLs -->
          <div class="form-group vertical">
            <h3 class="section-label">Faces Art URLs</h3>
            <div class="url-container">
              <div v-for="(url, idx) in editedConcept.faces" :key="'face-' + idx" class="url-item">
                <img v-if="url" :src="url" alt="Face thumbnail" class="url-thumb" />
                <input type="text" v-model="editedConcept.faces[idx]" class="modal-input"
                  :placeholder="`Face URL #${idx + 1}`" />
                <div class="url-buttons">
                  <button type="button" class="button small" @click="moveFaceUrl(idx, -1)" :disabled="idx === 0"
                    title="Move Up">
                    ▲
                  </button>
                  <button type="button" class="button small" @click="moveFaceUrl(idx, 1)"
                    :disabled="idx === editedConcept.faces.length - 1" title="Move Down">
                    ▼
                  </button>
                  <button type="button" class="button button-danger small" @click="removeFaceUrl(idx)">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <button type="button" class="button button-primary small" @click="addFaceUrl">
              Add Face URL
            </button>
          </div>

          <!-- Places URLs -->
          <div class="form-group vertical">
            <h3 class="section-label">Places Art URLs</h3>
            <div class="url-container">
              <div v-for="(url, idx) in editedConcept.places" :key="'place-' + idx" class="url-item">
                <img v-if="url" :src="url" alt="Place thumbnail" class="url-thumb" />
                <input type="text" v-model="editedConcept.places[idx]" class="modal-input"
                  :placeholder="`Place URL #${idx + 1}`" />
                <div class="url-buttons">
                  <button type="button" class="button small" @click="movePlaceUrl(idx, -1)" :disabled="idx === 0"
                    title="Move Up">
                    ▲
                  </button>
                  <button type="button" class="button small" @click="movePlaceUrl(idx, 1)"
                    :disabled="idx === editedConcept.places.length - 1" title="Move Down">
                    ▼
                  </button>
                  <button type="button" class="button button-danger small" @click="removePlaceUrl(idx)">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <button type="button" class="button button-primary small" @click="addPlaceUrl">
              Add Place URL
            </button>
          </div>

          <div class="form-group vertical">
            <h3 class="section-label">Music Playlists</h3>
            <p class="helper-text">
              Paste embed codes from Spotify or Apple Music
            </p>
            <div class="url-container">
              <div v-for="(playlist, idx) in editedConcept.playlists" :key="'playlist-' + idx"
                class="playlist-item url-item">
                <div class="playlist-service-selector">
                  <select v-model="playlist.service" class="service-select">
                    <option value="spotify">Spotify</option>
                    <option value="apple">Apple Music</option>
                  </select>
                </div>
                <input type="text" v-model="playlist.embedCode" class="modal-input playlist-input"
                  :placeholder="`Paste embed code`" />
                <div class="url-buttons">
                  <button type="button" class="button small" @click="movePlaylist(idx, -1)" :disabled="idx === 0"
                    title="Move Up">
                    ▲
                  </button>
                  <button type="button" class="button small" @click="movePlaylist(idx, 1)"
                    :disabled="idx === editedConcept.playlists.length - 1" title="Move Down">
                    ▼
                  </button>
                  <button type="button" class="button button-danger small" @click="removePlaylist(idx)">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <button type="button" class="button button-primary small" @click="addPlaylist">
              Add Playlist
            </button>
          </div>
        </div>
      </div>

      <!-- Save/Cancel/Delete Buttons - Outside the columns -->
      <div class="form-buttons danger-zone" ref="originalButtons">
        <button type="button" class="button button-primary" @click="saveChanges">
          Save Changes
        </button>
        <button type="button" class="button" @click="cancelEdit">Cancel</button>
        <button type="button" class="button button-danger" @click="deleteConcept">
          Delete Concept
        </button>
      </div>
    </div>

    <!-- Floating action bar -->
    <transition name="fade">
      <div class="floating-action-bar" v-if="showFloatingButtons">
        <div class="floating-buttons">
          <button type="button" class="button button-primary" @click="saveChanges">
            Save Changes
          </button>
          <button type="button" class="button" @click="cancelEdit">
            Cancel
          </button>
          <button type="button" class="button button-danger" @click="deleteConcept">
            Delete Concept
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import TextEditor from '@/components/TextEditor.vue'

export default {
  components: {
    TextEditor,
  },
  props: {
    concept: {
      type: Object,
      required: true,
    },
  },
  emits: ['update', 'delete', 'close'],
  data() {
    return {
      editedConcept: { ...this.concept },
      expandedHooks: {},
      showFloatingButtons: false,
    }
  },
  methods: {
    // Form actions
    saveChanges() {
      this.$emit('update', this.editedConcept)
      this.$emit('close')
    },

    cancelEdit() {
      this.$emit('close')
    },

    deleteConcept() {
      if (
        confirm(
          `Are you sure you want to delete the concept "${this.editedConcept.name}"?`,
        )
      ) {
        this.$emit('delete', this.editedConcept)
      }
    },

    // Art URL methods
    addArtUrl() {
      if (!this.editedConcept.artUrls) this.editedConcept.artUrls = []
      this.editedConcept.artUrls.push('')
    },

    removeArtUrl(idx) {
      this.editedConcept.artUrls.splice(idx, 1)
    },

    moveArtUrl(idx, direction) {
      const urls = this.editedConcept.artUrls
      const newIndex = idx + direction
      if (newIndex < 0 || newIndex >= urls.length) return
        ;[urls[idx], urls[newIndex]] = [urls[newIndex], urls[idx]]
    },

    // Face URL methods
    addFaceUrl() {
      if (!this.editedConcept.faces) this.editedConcept.faces = []
      this.editedConcept.faces.push('')
    },

    removeFaceUrl(idx) {
      this.editedConcept.faces.splice(idx, 1)
    },

    moveFaceUrl(idx, direction) {
      const urls = this.editedConcept.faces
      const newIndex = idx + direction
      if (newIndex < 0 || newIndex >= urls.length) return
        ;[urls[idx], urls[newIndex]] = [urls[newIndex], urls[idx]]
    },

    // Place URL methods
    addPlaceUrl() {
      if (!this.editedConcept.places) this.editedConcept.places = []
      this.editedConcept.places.push('')
    },

    removePlaceUrl(idx) {
      this.editedConcept.places.splice(idx, 1)
    },

    movePlaceUrl(idx, direction) {
      const urls = this.editedConcept.places
      const newIndex = idx + direction
      if (newIndex < 0 || newIndex >= urls.length) return
        ;[urls[idx], urls[newIndex]] = [urls[newIndex], urls[idx]]
    },

    // Hook methods
    toggleHookExpansion(hookId) {
      // Replace this.$set with direct assignment
      this.expandedHooks[hookId] = !this.expandedHooks[hookId]

      // If expanding, resize textareas on next tick after they're visible
      if (this.expandedHooks[hookId]) {
        this.$nextTick(() => {
          // Find textareas in this hook and resize them
          const textareas = this.$refs.hookTextarea
          if (textareas) {
            if (Array.isArray(textareas)) {
              textareas.forEach((textarea) =>
                this.resizeTextarea({ target: textarea }),
              )
            } else {
              this.resizeTextarea({ target: textareas })
            }
          }
        })
      }
    },

    isHookExpanded(hookId) {
      return !!this.expandedHooks[hookId]
    },

    addHook() {
      this.editedConcept.hooks = this.editedConcept.hooks || []
      const hookId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
      this.editedConcept.hooks.push({
        id: hookId,
        name: '',
        description: '',
        gmNotes: '',
        isDeleted: false,
      })
      // Replace this.$set with direct assignment
      this.expandedHooks[hookId] = true
    },

    removeHook(idx) {
      this.editedConcept.hooks.splice(idx, 1)
    },

    // Playlist methods
    addPlaylist() {
      if (!this.editedConcept.playlists) this.editedConcept.playlists = []
      this.editedConcept.playlists.push({
        service: 'spotify', // Default to Spotify
        embedCode: '',
      })
    },

    removePlaylist(idx) {
      this.editedConcept.playlists.splice(idx, 1)
    },

    movePlaylist(idx, direction) {
      const playlists = this.editedConcept.playlists
      const newIndex = idx + direction
      if (newIndex < 0 || newIndex >= playlists.length) return
        ;[playlists[idx], playlists[newIndex]] = [
          playlists[newIndex],
          playlists[idx],
        ]
    },

    // Auto-resize textarea
    resizeTextarea(event) {
      const textarea = event.target
      // Reset height temporarily to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set the height to match content
      textarea.style.height = textarea.scrollHeight + 'px'
    },

    handleScroll() {
      const modalContent = this.$refs.modalContent
      const originalButtons = this.$refs.originalButtons

      if (!modalContent || !originalButtons) return

      // Get position data for the original buttons
      const buttonRect = originalButtons.getBoundingClientRect()
      const modalRect = modalContent.getBoundingClientRect()

      // Show floating buttons when original buttons are not visible in the viewport
      this.showFloatingButtons =
        buttonRect.bottom > window.innerHeight || buttonRect.top < modalRect.top
    },
  },

  mounted() {
    // Resize all textareas on initial load
    this.$nextTick(() => {
      if (this.$refs.hookTextarea) {
        const textareas = this.$refs.hookTextarea
        if (Array.isArray(textareas)) {
          textareas.forEach((textarea) =>
            this.resizeTextarea({ target: textarea }),
          )
        } else {
          this.resizeTextarea({ target: textareas })
        }
      }
      this.handleScroll()
    })
  },
}
</script>

<style scoped>
.modal-content {
  text-align: left;
  width: 100%;
  max-width: 900px;
  /* Increased from 500px to accommodate two columns */
  border-radius: 8px;
  padding: 20px;
  background: #1e1e1e;
  color: white;
}

.two-column-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.left-column {
  flex: 1;
  min-width: 300px;
}

.right-column {
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  padding-left: 20px;
  border-left: 1px solid #444;
}

.url-container {
  display: flex;
  flex-direction: column;
  overflow-y: none;
  padding-right: 10px;
  margin-bottom: 10px;
}

.url-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  vertical-align: middle;
  justify-content: center;
  width: 100%;
  background: #181818;
  border-radius: 6px;
}

.url-thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #222;
  border: 1px solid #444;
}

.url-input {
  width: 100%;
  margin-bottom: 8px;
  align-self: middle;
}

.url-buttons {
  display: flex;
  gap: 4px;
  align-self: middle;
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.form-group.vertical {
  flex-direction: column;
  align-items: flex-start;
}

.form-group.centered {
  justify-content: center;
}

label {
  margin-right: 5px;
  font-size: 14px;
  color: darkgray;
}

.modal-input {
  width: 100%;
  padding: 4px 6px;
  font-size: 0.95em;
  font-family: 'Lora', serif;
  color: white;
  background-color: black;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 28px;
  box-sizing: border-box;
}

textarea.modal-input {
  resize: vertical;
  min-height: 80px;
  font-size: 0.95em;
}

/* URL items */
.url-item {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 4px;
}

.url-input {
  margin-right: 10px;
  flex: 1;
}

.url-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  margin: 5px 5px 5px 0;
  background: #222;
  border: 1px solid #444;
}

/* Hooks */
.hook-edit-card {
  background: black;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  width: 95%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.hook-header {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
  /* Space between header and expanded content */
}

.hook-caret {
  cursor: pointer;
  padding: 0 10px 0 5px;
  font-size: 12px;
  user-select: none;
}

.hook-label {
  white-space: nowrap;
  /* Prevent wrapping of labels */
  margin-right: 8px;
  /* Space between label and input */
  color: #aaa;
  font-size: 13px;
}

.hook-input {
  flex: 1;
  /* Input takes remaining space */
  margin-bottom: 0;
}

.hook-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
  padding-left: 25px;
  /* Align with the name input after caret */
}

.hook-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 5px;
}

/* Delete button container with right alignment */
.delete-hook-container {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px;
}

.delete-hook-btn {
  font-size: 0.85em;
  padding: 4px 10px;
}

/* Color inputs */
input[type='color'] {
  width: 50px;
  height: 30px;
  border: none;
  cursor: pointer;
}

/* Buttons */
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  background-color: #333;
  color: #fff;
}

.button:hover {
  opacity: 0.9;
}

.button.small {
  font-size: 0.85em;
  padding: 2px 8px;
  margin-top: 2px;
  margin-left: 4px;
}

.button.small:first-of-type {
  margin-left: 0;
}

.button-primary {
  background-color: #4caf50;
  color: white;
}

.button-danger {
  background-color: #f44336;
  color: white;
}

.form-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.danger-zone {
  margin-top: 30px;
  border-top: 1px solid #444;
  padding-top: 20px;
}

/* New section label style */
.section-label {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  margin-top: 5px;
  width: 100%;
}

/* Update regular labels to be smaller and more subtle */
label {
  margin-right: 5px;
  font-size: 14px;
  color: #aaa;
}

/* Floating action bar */
.floating-action-bar {
  position: fixed;
  bottom: 0;
  align-self: center;
  background: rgba(30, 30, 30, 0.95);
  border-top: 1px solid #444;
  border-radius: 5px 5px 0 0;
  padding: 10px 20px;
  z-index: 1100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  width: fit-content;
}

.floating-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  max-width: 900px;
  margin: 0 auto;
}

/* Transition effects */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Playlist editor styles */
.playlist-item {
  border: 1px solid #444;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.playlist-service-selector {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.service-select {
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

.playlist-input {
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
  margin: -7px 10px 0 10px;
}

.helper-text {
  font-size: 13px;
  color: #aaa;
  margin-top: -5px;
  margin-bottom: 10px;
}
</style>
