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
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelPlaylistEdit" type="button" />
        <ActionButton variant="primary" size="small" text="+ Add" @click="addPlaylist" type="button" />
      </div>
    </div>

    <!-- DISPLAY MODE -->
    <div v-else>
      <!-- Playlist Embeds -->
      <div class="playlist-container">
        <div v-for="(playlist, index) in localPlaylists" :key="`playlist-${index}`" class="playlist-embed"
          v-html="safeEmbed(playlist)"></div>
      </div>
    </div>
  </ConceptSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import '@/styles/concept-components.css'
import ConceptSection from '../shared/ConceptSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
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

const localPlaylists = ref([])
const isSectionEditing = ref(false)

const hasPlaylists = computed(() => {
  return localPlaylists.value && localPlaylists.value.length > 0
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

const processAppleEmbedCodes = () => {
  localPlaylists.value = localPlaylists.value.map((embedCode) => {
    if (embedCode) {
      // Extract the src attribute
      const srcMatch = embedCode.match(/src="([^"]+)"/)
      if (srcMatch && srcMatch[1]) {
        const originalSrc = srcMatch[1]

        // Add dark theme parameter if not already present
        if (!originalSrc.includes('theme=dark')) {
          const newSrc =
            originalSrc +
            (originalSrc.includes('?') ? '&theme=dark' : '?theme=dark')

          // Replace the src in the embed code
          return embedCode
            .replace(`src="${originalSrc}"`, `src="${newSrc}"`)
            .replace(`src='${originalSrc}'`, `src='${newSrc}'`)
        }
      }
    }
    return embedCode
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
