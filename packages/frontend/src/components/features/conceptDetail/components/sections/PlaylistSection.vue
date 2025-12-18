<template>
  <ConceptSection title="Playlists" :has-content="hasPlaylists" :is-edit-mode="editable" :show-edit-button="editable"
    :is-section-editing="isSectionEditing" @toggle-edit="togglePlaylistEditing" empty-message="No playlists added yet.">

    <!-- EDIT MODE -->
    <div v-if="isSectionEditing && editable" class="section-editor">
      <p class="helper-text">Paste embed codes from Spotify or Apple Music</p>
      <div class="url-container">
        <div v-for="(playlist, index) in localPlaylists" :key="'playlist-' + index" class="edit-item-light">
          <div class="playlist-service-selector">
            <select v-model="playlist.service" class="service-select">
              <option value="spotify">Spotify</option>
              <option value="apple">Apple Music</option>
            </select>
          </div>
          <input type="text" v-model="playlist.embedCode" class="modal-input playlist-input"
            placeholder="Paste embed code" />
          <div class="url-buttons">
            <FloatingActionButton type="edit" size="small" @click="movePlaylist(index, -1)" :disabled="index === 0"
              title="Move Up" :icon="ChevronUpIcon" />
            <FloatingActionButton type="edit" size="small" @click="movePlaylist(index, 1)"
              :disabled="index === localPlaylists.length - 1" title="Move Down" :icon="ChevronDownIcon" />
            <FloatingActionButton type="delete" size="small" @click="removePlaylist(index)" title="Remove" />
          </div>
        </div>
      </div>
      <div class="editor-buttons">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelPlaylistEdit" type="button" />
        <ActionButton variant="primary" size="small" text="+ Add" @click="addPlaylist" type="button" />
      </div>
    </div>

    <!-- DISPLAY MODE -->
    <div v-else>
      <!-- Service Toggle -->
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
  </ConceptSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import '@/styles/concept-components.css'
import ConceptSection from '../shared/ConceptSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { sanitizeEmbedHtml } from '@/utils/sanitizeHtml'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

const playlistService = ref('apple')
const localPlaylists = ref([])
const isSectionEditing = ref(false)

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

const syncLocalPlaylists = (sourceConcept) => {
  if (!sourceConcept) return
  localPlaylists.value = sourceConcept.playlists ? [...sourceConcept.playlists] : []
}

const togglePlaylistEditing = async () => {
  if (!props.editable) return

  if (isSectionEditing.value) {
    if (concept.value) {
      processAppleEmbedCodes()
      concept.value.playlists = [...localPlaylists.value]
      await conceptsStore.update(concept.value)
    }
    isSectionEditing.value = false
  } else {
    isSectionEditing.value = true
  }
}

const cancelPlaylistEdit = () => {
  syncLocalPlaylists(concept.value)
  isSectionEditing.value = false
}

const addPlaylist = () => {
  localPlaylists.value.push({
    service: 'spotify',
    embedCode: '',
  })
}

const removePlaylist = (index) => {
  localPlaylists.value.splice(index, 1)
}

const movePlaylist = (index, direction) => {
  const playlists = localPlaylists.value
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < playlists.length) {
    [playlists[index], playlists[newIndex]] = [
      playlists[newIndex],
      playlists[index],
    ]
  }
}

const processAppleEmbedCodes = () => {
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

watch(concept, (newConcept) => {
  if (!newConcept || isSectionEditing.value) return
  syncLocalPlaylists(newConcept)
}, { immediate: true })
</script>

<style scoped>
.helper-text {
  font-size: var(--font-size-14);
  color: var(--color-gray-light);
  margin-bottom: var(--space-xs);
}

.playlist-toggle {
  display: flex;
  gap: var(--space-md);
  margin-bottom: 15px;
}

.playlist-toggle-btn {
  background: var(--overlay-black-medium);
  border: 1px solid var(--color-gray-medium);
  color: var(--color-gray-light);
  padding: var(--space-sm) 16px;
  border-radius: var(--radius-5);
  cursor: pointer;
  transition: var(--transition-all);
}

.playlist-toggle-btn.active {
  background: var(--overlay-black-medium);
  border-color: var(--color-accent-gold);
  color: var(--color-text-primary);
}

.playlist-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.playlist-embed {
  width: 100%;
  background: var(--overlay-white-subtle);
  border-radius: var(--radius-10);
}

.no-playlists {
  padding: var(--space-lg);
  background: var(--overlay-white-subtle);
  border-radius: var(--radius-10);
  text-align: center;
  color: var(--color-gray-light);
}

.url-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-xs);
}

.url-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.playlist-service-selector {
  margin-bottom: var(--space-xs);
}

.service-select {
  padding: var(--space-xs);
  background: var(--overlay-white-medium);
  border: var(--border-width-sm) solid var(--color-gray-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-5);
}

.playlist-input {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}
</style>
