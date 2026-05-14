<template>
  <ConceptSection title="Playlists" :has-content="hasPlaylists" :is-edit-mode="editable" :show-edit-button="editable"
    :is-section-editing="isSectionEditing" @toggle-edit="togglePlaylistEditing" empty-message="No playlists added yet.">

    <!-- EDIT MODE -->
    <div v-if="isSectionEditing && editable" class="section-editor">
      <p class="helper-text">Paste embed codes from Apple Music</p>
      <div class="url-container">
        <div v-for="(playlist, index) in localPlaylists" :key="'playlist-' + index" class="edit-item-light">
          <div class="url-buttons">
            <div v-if="extractPlaylistName(playlist)" class="playlist-name">
              {{ extractPlaylistName(playlist) }}
            </div>
            <div class="button-group">
              <ActionButton variant="neutral" size="small" @click="movePlaylist(index, -1)" :disabled="index === 0"
                title="Move Up">
                <ChevronUpIcon class="button-icon" />
              </ActionButton>
              <ActionButton variant="neutral" size="small" @click="movePlaylist(index, 1)"
                :disabled="index === localPlaylists.length - 1" title="Move Down">
                <ChevronDownIcon class="button-icon" />
              </ActionButton>
              <ActionButton variant="danger" size="small" @click="removePlaylist(index)" text="Remove" />
            </div>
          </div>
          <input type="text" v-model="localPlaylists[index]" class="modal-input playlist-input"
            placeholder="Paste embed code" />
        </div>
      </div>
      <div class="editor-buttons">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelPlaylistEdit" />
        <ActionButton variant="primary" size="small" text="+ Add" @click="addPlaylist" />
      </div>
    </div>

    <!-- DISPLAY MODE -->
    <div v-else>
      <div class="playlist-nav-wrapper" @mouseenter="showNav = true" @mouseleave="showNav = false">
        <button v-if="showNav && totalPages > 1" class="nav-button left" @click="prevPage" aria-label="Previous page">
          <ChevronLeftIcon class="nav-icon" />
        </button>
        <div class="playlist-page">
          <div v-for="(playlist, index) in currentPagePlaylists" :key="currentPage * 2 + index" class="playlist-embed"
            v-html="safeEmbed(playlist)">
          </div>
        </div>
        <button v-if="showNav && totalPages > 1" class="nav-button right" @click="nextPage" aria-label="Next page">
          <ChevronRightIcon class="nav-icon" />
        </button>
      </div>
      <div v-if="totalPages > 1" class="playlist-dots">
        <span v-for="page in totalPages" :key="page - 1" class="playlist-dot"
          :class="{ active: page - 1 === currentPage }" @click="currentPage = page - 1">
        </span>
      </div>
    </div>
  </ConceptSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import '@/styles/concept-components.css'
import ConceptSection from '../shared/ConceptSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
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

const localPlaylists = ref([])
const isSectionEditing = ref(false)
const currentPage = ref(0)
const showNav = ref(false)

const totalPages = computed(() => Math.ceil(localPlaylists.value.length / 2))
const currentPagePlaylists = computed(() => localPlaylists.value.slice(currentPage.value * 2, currentPage.value * 2 + 2))

const hasPlaylists = computed(() => {
  return localPlaylists.value && localPlaylists.value.length > 0
})

const syncLocalPlaylists = (sourceConcept) => {
  if (!sourceConcept) return
  localPlaylists.value = sourceConcept.playlists ? [...sourceConcept.playlists] : []
  if (currentPage.value >= Math.ceil(localPlaylists.value.length / 2)) {
    currentPage.value = Math.max(0, Math.ceil(localPlaylists.value.length / 2) - 1)
  }
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
  localPlaylists.value.push('')
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

const extractPlaylistName = (embedCode) => {
  if (!embedCode) return ''
  const match = embedCode.match(/\/playlist\/([^/]+)\/pl\.u-/)
  if (match && match[1]) {
    return match[1].split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
  return ''
}

const APPLE_MUSIC_SANDBOX = 'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation'
const APPLE_MUSIC_HEIGHT = 450

// Normalize an embed code: enforce dark theme, correct height, and sandbox.
// Called at both save time (processAppleEmbedCodes) and render time (safeEmbed),
// because DOMPurify strips sandbox on every sanitize pass.
const normalizeEmbedCode = (embedCode) => {
  if (!embedCode) return embedCode
  let code = embedCode

  // Dark theme
  const srcMatch = code.match(/src="([^"]+)"/)
  if (srcMatch?.[1] && !srcMatch[1].includes('theme=dark')) {
    const src = srcMatch[1]
    const newSrc = src + (src.includes('?') ? '&theme=dark' : '?theme=dark')
    code = code.replace(`src="${src}"`, `src="${newSrc}"`)
  }

  // Height — enforce minimum 450 for the full-view layout (large artwork header + tracklist)
  const heightMatch = code.match(/height="(\d+)"/)
  if (heightMatch) {
    if (parseInt(heightMatch[1], 10) < APPLE_MUSIC_HEIGHT) {
      code = code.replace(heightMatch[0], `height="${APPLE_MUSIC_HEIGHT}"`)
    }
  } else {
    code = code.replace('<iframe ', `<iframe height="${APPLE_MUSIC_HEIGHT}" `)
  }

  // Sandbox — DOMPurify strips this unless we add it back at display time
  if (!code.includes('sandbox=')) {
    code = code.replace('<iframe ', `<iframe sandbox="${APPLE_MUSIC_SANDBOX}" `)
  }

  return code
}

const processAppleEmbedCodes = () => {
  localPlaylists.value = localPlaylists.value.map(normalizeEmbedCode)
}

const prevPage = () => {
  currentPage.value = (currentPage.value - 1 + totalPages.value) % totalPages.value
}

const nextPage = () => {
  currentPage.value = (currentPage.value + 1) % totalPages.value
}

// Normalize first (restore sandbox + enforce height), then sanitize.
// Normalization must come before sanitize because DOMPurify would strip sandbox otherwise.
const safeEmbed = (html) => sanitizeEmbedHtml(normalizeEmbedCode(html))

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

.playlist-nav-wrapper {
  position: relative;
}

.playlist-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
}

.playlist-embed {
  width: 100%;
  background: var(--overlay-white-subtle);
  border-radius: var(--radius-10);
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--overlay-black-medium);
  border: none;
  color: var(--color-white);
  border-radius: var(--radius-full);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: var(--z-raised);
}

.nav-button:hover {
  background: var(--overlay-black-heavy);
}

.nav-button.left {
  left: var(--space-xs);
}

.nav-button.right {
  right: var(--space-xs);
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.playlist-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: var(--space-xs);
  align-items: center;
}

.playlist-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--overlay-white-medium);
  cursor: pointer;
  transition: background var(--transition-normal);
}

.playlist-dot.active {
  background: var(--color-white);
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
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xs);
}

.button-group {
  display: flex;
  gap: var(--space-xs);
}

.playlist-name {
  font-weight: 500;
  color: var(--color-primary);
  font-size: var(--font-size-14);
}

.button-icon {
  width: 16px;
  height: 16px;
}

.playlist-input {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}
</style>
