<template>
  <div class="concept-section" v-if="hasPlaylists || editable">
    <h2 class="section-header">
      Playlists
      <button v-if="editable" class="edit-section-button" @click="togglePlaylistEditing" title="Edit playlists">
        ✎
      </button>
    </h2>

    <!-- Playlist Editor -->
    <div v-if="editMode.isEditing && editable" class="section-editor">
      <p class="helper-text">Paste embed codes from Spotify or Apple Music</p>
      <div class="url-container">
        <div v-for="(playlist, idx) in localPlaylists" :key="'playlist-' + idx" class="edit-item">
          <div class="playlist-service-selector">
            <select v-model="playlist.service" class="service-select">
              <option value="spotify">Spotify</option>
              <option value="apple">Apple Music</option>
            </select>
          </div>
          <input type="text" v-model="playlist.embedCode" class="modal-input playlist-input"
            placeholder="Paste embed code" />
          <div class="url-buttons">
            <button type="button" class="button small" @click="movePlaylist(idx, -1)" :disabled="idx === 0"
              title="Move Up">
              ▲
            </button>
            <button type="button" class="button small" @click="movePlaylist(idx, 1)"
              :disabled="idx === localPlaylists.length - 1" title="Move Down">
              ▼
            </button>
            <button type="button" class="button button-danger small" @click="removePlaylist(idx)">
              ✕
            </button>
          </div>
        </div>
      </div>
      <div class="editor-buttons">
        <button type="button" class="button button-primary small" @click="addPlaylist">
          Add Playlist
        </button>
        <button type="button" class="button small" @click="savePlaylistChanges">
          Done
        </button>
        <button type="button" class="button small" @click="cancelPlaylistEdit">
          Cancel
        </button>
      </div>
    </div>

    <!-- Service Toggle (when not editing) -->
    <div v-else>
      <div class="playlist-toggle">
        <button class="playlist-toggle-btn" :class="{ active: playlistService === 'apple' }"
          @click="playlistService = 'apple'">
          <i class="fa fa-music"></i> Apple Music
        </button>
        <button class="playlist-toggle-btn" :class="{ active: playlistService === 'spotify' }"
          @click="playlistService = 'spotify'">
          <i class="fa fa-spotify"></i> Spotify
        </button>
      </div>

      <!-- Playlist Embeds -->
      <div class="playlist-container">
        <div v-for="(playlist, index) in filteredPlaylists" :key="`playlist-${index}`" class="playlist-embed"
          v-html="safeEmbed(playlist.embedCode)"></div>
        <div v-if="filteredPlaylists.length === 0" class="no-playlists">
          No
          {{
            playlistService === 'spotify' ? 'Spotify' : 'Apple Music'
          }}
          playlists available.
          <span v-if="hasOtherServicePlaylists">
            Try switching to
            {{ playlistService === 'spotify' ? 'Apple Music' : 'Spotify' }}.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import '@/assets/styles/concept-components.css'
import { useEditMode } from '@/composables/useEditMode'
import { sanitizeEmbedHtml } from '@/utils/sanitizeHtml'

// Props
const props = defineProps({
  playlists: {
    type: Array,
    default: () => [],
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update'])

// Reactive state
const playlistService = ref('apple')
const localPlaylists = ref([])

// Edit mode composable
const editMode = useEditMode({
  onSave: () => {
    // Process Apple Music embed codes to ensure dark theme
    processAppleEmbedCodes()
    emit('update', localPlaylists.value)
  },
  onCancel: (restoredData) => {
    if (restoredData) {
      localPlaylists.value = [...restoredData]
    }
  }
})

// Computed properties
const hasPlaylists = computed(() => {
  return localPlaylists.value && localPlaylists.value.length > 0
})

const filteredPlaylists = computed(() => {
  return localPlaylists.value.filter(
    (playlist) => playlist.service === playlistService.value,
  )
})

const hasOtherServicePlaylists = computed(() => {
  const otherService =
    playlistService.value === 'spotify' ? 'apple' : 'spotify'
  return localPlaylists.value.some((p) => p.service === otherService)
})

// Methods
const togglePlaylistEditing = () => {
  if (!props.editable) return

  if (!editMode.isEditing.value) {
    editMode.startEdit(localPlaylists.value)
  } else {
    editMode.saveEdit(localPlaylists.value)
  }
}

const savePlaylistChanges = () => {
  editMode.saveEdit(localPlaylists.value)
}

const cancelPlaylistEdit = () => {
  const restored = editMode.cancelEdit()
  if (restored) {
    localPlaylists.value = [...restored]
  }
}

const addPlaylist = () => {
  localPlaylists.value.push({
    service: 'spotify',
    embedCode: '',
  })
}

const removePlaylist = (idx) => {
  localPlaylists.value.splice(idx, 1)
}

const movePlaylist = (idx, direction) => {
  const playlists = localPlaylists.value
  const newIdx = idx + direction
  if (newIdx >= 0 && newIdx < playlists.length) {
    [playlists[idx], playlists[newIdx]] = [
      playlists[newIdx],
      playlists[idx],
    ]
  }
}

const processAppleEmbedCodes = () => {
  // Function to ensure dark theme is set for Apple Music embeds
  localPlaylists.value.forEach((playlist) => {
    if (playlist.service === 'apple' && playlist.embedCode) {
      // Extract the src attribute
      const srcMatch = playlist.embedCode.match(/src="([^"]+)"/)
      if (srcMatch && srcMatch[1]) {
        const originalSrc = srcMatch[1]

        // Add dark theme parameter if not already present
        const newSrc =
          originalSrc +
          (originalSrc.includes('?') ? '&theme=dark' : '?theme=dark')

        // Replace the src in the embed code
        playlist.embedCode = playlist.embedCode
          .replace(`src="${originalSrc}"`, `src="${newSrc}"`)
          .replace(`src='${originalSrc}'`, `src='${newSrc}'`)
      }
    }
  })
}

const safeEmbed = (html) => sanitizeEmbedHtml(html)

// Watchers
watch(() => props.playlists, (newPlaylists) => {
  localPlaylists.value = JSON.parse(JSON.stringify(newPlaylists || []))
}, { immediate: true })
</script>

<style scoped>
/* Component-specific styles */
.helper-text {
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 10px;
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

/* URL containers and items */
.url-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.url-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 5px;
}

.playlist-service-selector {
  margin-bottom: 8px;
}

.service-select {
  padding: 5px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #555;
  color: lightgray;
  border-radius: 4px;
}

.playlist-input {
  width: 100%;
}
</style>
