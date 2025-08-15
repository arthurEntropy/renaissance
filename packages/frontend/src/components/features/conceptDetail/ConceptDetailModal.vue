<template>
  <div class="modal-overlay" @click.self="handleClose">
    <!-- Admin Controls -->
    <ConceptHeader :editable="editable" :is-edit-mode="isEditMode" @toggle-edit-mode="handleToggleEditMode"
      @open-settings="openSettingsModal" />

    <div class="modal-content-base modal-content">
      <!-- Desktop Layout: Left/Right Columns -->
      <div v-if="isDesktop" class="concept-layout-desktop">
        <!-- Left Column -->
        <LeftColumn :concept="localConcept" :is-edit-mode="isEditMode" @update:featured-art="updateFeaturedArt"
          @update:novizio="updateNovizio" @update:faces="updateFaces" @update:places="updatePlaces"
          @update:playlists="updatePlaylists" @unsaved-changes="onSectionUnsavedChanges"
          @reset-unsaved-changes="onSectionResetUnsavedChanges" />

        <!-- Right Column -->
        <RightColumn :concept="localConcept" :abilities="abilities" :equipment="equipment" :sources="sources"
          :is-edit-mode="isEditMode" :expansion="expansion" @update:name="updateName"
          @update:description="updateDescription" @update:local-flavor="updateLocalFlavor" @update:hooks="updateHooks"
          @edit-ability="emitAbilityEdit" @edit-equipment="emitEquipmentEdit" @unsaved-changes="onSectionUnsavedChanges"
          @reset-unsaved-changes="onSectionResetUnsavedChanges" />
      </div>

      <!-- Mobile Layout: Single Column -->
      <MobileLayout v-else :concept="localConcept" :abilities="abilities" :equipment="equipment" :sources="sources"
        :is-edit-mode="isEditMode" :expansion="expansion" @update:featured-art="updateFeaturedArt"
        @update:name="updateName" @update:description="updateDescription" @update:local-flavor="updateLocalFlavor"
        @update:hooks="updateHooks" @update:faces="updateFaces" @update:places="updatePlaces"
        @update:playlists="updatePlaylists" @update:novizio="updateNovizio" @edit-ability="emitAbilityEdit"
        @edit-equipment="emitEquipmentEdit" @unsaved-changes="onSectionUnsavedChanges"
        @reset-unsaved-changes="onSectionResetUnsavedChanges" />
    </div>

    <!-- Settings Modal -->
    <SettingsModal :visible="showSettingsModal" :settings="tempSettings" @update:settings="tempSettings = $event"
      @save="saveSettings" @cancel="closeSettingsModal" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ConceptHeader from './components/ConceptHeader.vue'
import LeftColumn from './components/sections/LeftColumn.vue'
import RightColumn from './components/sections/RightColumn.vue'
import MobileLayout from './components/sections/MobileLayout.vue'
import SettingsModal from './components/ConceptSettingsModal.vue'

// Composables
import { useConceptEditMode } from './composables/useConceptEditMode'
import { useConceptData } from './composables/useConceptData'
import { useUnsavedChanges } from './composables/useUnsavedChanges'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

// Store imports
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useSourcesStore } from '@/stores/sourcesStore'

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
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources

// Local reactive state
const localConcept = ref({})
const showSettingsModal = ref(false)
const tempSettings = ref({
  backgroundImage: '',
  color1: '#ffffff',
  color2: '#000000',
})
const expansions = ref([])

// Composables
const {
  isEditMode,
  hasUnsavedChanges: hasUnsavedSectionChanges,
  toggleEditMode,
  onSectionUnsavedChanges,
  onSectionResetUnsavedChanges
} = useConceptEditMode()

const {
  hasUnsavedChanges,
  confirmIfUnsaved
} = useUnsavedChanges()

const {
  abilities,
  equipment
} = useConceptData(localConcept)

const {
  isDesktop
} = useResponsiveLayout()

// Computed properties
const expansion = computed(() => {
  if (!localConcept.value.expansion) return null
  return expansions.value.find(e => e.id === localConcept.value.expansion) || null
})

// Watchers
watch(() => props.concept, (newConcept) => {
  // Deep clone the concept to avoid direct mutations
  localConcept.value = JSON.parse(JSON.stringify(newConcept))
  localConcept.value.hooks = localConcept.value.hooks || []
  localConcept.value.playlists = localConcept.value.playlists || []
  localConcept.value.artUrls = localConcept.value.artUrls || []
  localConcept.value.faces = localConcept.value.faces || []
  localConcept.value.places = localConcept.value.places || []
}, { immediate: true })

// Methods
const handleToggleEditMode = () => {
  toggleEditMode(() => emitUpdateEvent())
  emit('edit-mode-change', isEditMode.value)
}

const emitUpdateEvent = () => {
  try {
    // Create a clean copy excluding methods and non-data properties
    const cleanConcept = {
      ...localConcept.value,
      artUrls: [...(localConcept.value.artUrls || [])],
      faces: [...(localConcept.value.faces || [])],
      places: [...(localConcept.value.places || [])],
      hooks: localConcept.value.hooks?.map(
        ({ id, name, description, gmNotes }) => ({
          id,
          name,
          description,
          gmNotes,
        }),
      ) || [],
      playlists: localConcept.value.playlists?.map(({ service, embedCode }) => ({
        service,
        embedCode,
      })) || [],
    }

    emit('update', cleanConcept)
  } catch (error) {
    console.error('Error in emitUpdateEvent:', error)
  }
}

const handleClose = () => {
  const hasChanges = hasUnsavedChanges.value || hasUnsavedSectionChanges.value

  if (hasChanges) {
    confirmIfUnsaved(() => emit('close'), 'You have unsaved changes. Are you sure you want to exit?')
  } else {
    emit('close')
  }
}

// Update methods
const updateName = (newName) => {
  localConcept.value.name = newName
  emitUpdateEvent()
}

const updateDescription = (newDescription) => {
  localConcept.value.description = newDescription
  emitUpdateEvent()
}

const updateFeaturedArt = (newImages) => {
  localConcept.value.artUrls = [...newImages]
  emitUpdateEvent()
}

const updateFaces = (newImages) => {
  localConcept.value.faces = [...newImages]
  emitUpdateEvent()
}

const updatePlaces = (newImages) => {
  localConcept.value.places = [...newImages]
  emitUpdateEvent()
}

const updateNovizio = (newNovizio) => {
  localConcept.value.novizio = newNovizio
  emitUpdateEvent()
}

const updatePlaylists = (newPlaylists) => {
  localConcept.value.playlists = newPlaylists
  emitUpdateEvent()
}

const updateLocalFlavor = (newLocalFlavor) => {
  Object.assign(localConcept.value, newLocalFlavor)
  emitUpdateEvent()
}

const updateHooks = (newHooks) => {
  localConcept.value.hooks = newHooks
  emitUpdateEvent()
}

const emitAbilityEdit = (ability) => {
  if (!isEditMode.value) return
  emit('edit-ability', ability)
}

const emitEquipmentEdit = (equipmentItem) => {
  if (!isEditMode.value) return
  emit('edit-equipment', equipmentItem)
}

// Settings modal methods
const openSettingsModal = () => {
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const saveSettings = () => {
  // Handle settings save logic here
  showSettingsModal.value = false
}

// Lifecycle
onMounted(async () => {
  try {
    await expansionStore.loadExpansions()
    expansions.value = expansionStore.expansions
  } catch (error) {
    console.error('Error initializing ConceptDetailModal:', error)
  }
})
</script>

<style scoped>
/* Component-specific overrides */
.modal-content {
  max-width: 1400px;
}

/* Global styles */
:global(body.modal-open) {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
</style>
