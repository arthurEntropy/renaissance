<template>
  <div class="concept-detail">

    <!-- Full-viewport background image -->
    <Teleport to="body">
      <div v-if="selectedConcept?.detailBackgroundImage" class="concept-detail-bg">
        <div class="concept-detail-bg-layer concept-detail-bg-preview" :style="detailBackgroundPreviewStyle" />
        <div class="concept-detail-bg-layer concept-detail-bg-full" :class="{ 'is-loaded': isDetailBackgroundLoaded }"
          :style="detailBackgroundFullStyle" />
      </div>
    </Teleport>

    <!-- Admin Controls -->
    <div class="admin-controls">
      <FloatingActionButton v-if="isEditMode" type="settings" size="large" visibility="always"
        @click="openSettingsModal" />
      <FloatingActionButton v-if="editable" type="edit" size="large" visibility="always" :is-active="isEditMode"
        @click="() => toggleEditMode()" />
    </div>

    <div class="concept-content">

      <!-- Desktop Layout: Grid Rows -->
      <div v-if="isDesktop" class="concept-layout-grid">

        <!-- Row 1: Art + Novizio (1fr) | Title + Description (2fr) -->
        <div class="concept-identity-row">
          <div class="concept-art-cell">
            <ConceptImageSection title="Featured Art" :show-title="false" :is-edit-mode="isEditMode"
              :mode="layout.combineFacesWithFeatured ? IMAGE_GALLERY_MODES.COMBINED : IMAGE_GALLERY_MODES.MANUAL" />
            <NovizioSection v-if="layout.showNovizio" :editable="isEditMode" />
          </div>
          <div class="concept-description-cell">
            <ConceptTitle :is-edit-mode="isEditMode" />
            <ConceptDescription :is-edit-mode="isEditMode" />
            <PhysiologySection v-if="layout.showPhysiology" :is-edit-mode="isEditMode" />
          </div>
        </div>

        <!-- Row 2: Images (Faces | Places | Maps | Playlist) — only rendered if at least one is visible -->
        <!-- Wrapper divs ensure all 4 grid columns are always present so hidden siblings don't create dead space -->
        <div v-if="layout.showFaces || layout.showPlaces || layout.showMaps || layout.showPlaylist"
          class="concept-grid-row-4">
          <div>
            <ConceptImageSection v-if="layout.showFaces" title="Faces" :is-edit-mode="isEditMode"
              :mode="IMAGE_GALLERY_MODES.AUTO" :auto-source-type="ART_TYPES.FACES" />
          </div>
          <div>
            <ConceptImageSection v-if="layout.showPlaces" title="Places" :is-edit-mode="isEditMode"
              :mode="IMAGE_GALLERY_MODES.AUTO" :auto-source-type="ART_TYPES.PLACES" />
          </div>
          <div>
            <ConceptImageSection v-if="layout.showMaps" title="Maps" :is-edit-mode="isEditMode"
              :mode="IMAGE_GALLERY_MODES.AUTO" :auto-source-type="ART_TYPES.MAPS" />
          </div>
          <div>
            <PlaylistSection v-if="layout.showPlaylist" :editable="isEditMode" />
          </div>
        </div>

        <!-- Row 3: Flavor (Local Flavor | Hooks) — only rendered if at least one is visible -->
        <!-- Wrapper divs ensure both grid columns are always present so a lone section doesn't stretch -->
        <div v-if="layout.showLocalFlavor || layout.showHooks" class="concept-grid-row-2">
          <div>
            <LocalFlavorSection v-if="layout.showLocalFlavor" :editable="isEditMode" />
          </div>
          <div>
            <HooksSection v-if="layout.showHooks" :editable="isEditMode" />
          </div>
        </div>

        <!-- Row 4: Abilities (full width) -->
        <ConceptAbilitiesSection v-if="layout.showAbilities" :key="conceptsStore.selectedConcept?.id"
          :is-edit-mode="isEditMode" @edit-ability="openAbilityModal" @add-ability="createNewAbility" />

        <!-- Row 5: Equipment (full width) -->
        <ConceptEquipmentSection v-if="layout.showEquipment" :is-edit-mode="isEditMode"
          @edit-equipment="openEquipmentModal" @add-equipment="createNewEquipment" />
      </div>

      <!-- Mobile Layout: Single Column -->
      <div v-else class="concept-layout-mobile">
        <ConceptImageSection title="Featured Art" :show-title="false" :is-edit-mode="isEditMode"
          :mode="layout.combineFacesWithFeatured ? IMAGE_GALLERY_MODES.COMBINED : IMAGE_GALLERY_MODES.MANUAL" />
        <NovizioSection v-if="layout.showNovizio" :editable="isEditMode" />
        <ConceptTitle :is-edit-mode="isEditMode" />
        <ConceptDescription :is-edit-mode="isEditMode" />
        <PhysiologySection v-if="layout.showPhysiology" :is-edit-mode="isEditMode" />
        <ConceptImageSection v-if="layout.showFaces" title="Faces" :is-edit-mode="isEditMode"
          :mode="IMAGE_GALLERY_MODES.AUTO" :auto-source-type="ART_TYPES.FACES" />
        <ConceptImageSection v-if="layout.showPlaces" title="Places" :is-edit-mode="isEditMode"
          :mode="IMAGE_GALLERY_MODES.AUTO" :auto-source-type="ART_TYPES.PLACES" />
        <ConceptImageSection v-if="layout.showMaps" title="Maps" :is-edit-mode="isEditMode"
          :mode="IMAGE_GALLERY_MODES.AUTO" :auto-source-type="ART_TYPES.MAPS" />
        <PlaylistSection v-if="layout.showPlaylist" :editable="isEditMode" />
        <LocalFlavorSection v-if="layout.showLocalFlavor" :editable="isEditMode" />
        <HooksSection v-if="layout.showHooks" :editable="isEditMode" />
        <ConceptAbilitiesSection v-if="layout.showAbilities" :key="conceptsStore.selectedConcept?.id"
          :is-edit-mode="isEditMode" @edit-ability="openAbilityModal" @add-ability="createNewAbility" />
        <ConceptEquipmentSection v-if="layout.showEquipment" :is-edit-mode="isEditMode"
          @edit-equipment="openEquipmentModal" @add-equipment="createNewEquipment" />
      </div>
    </div>

    <!-- Settings Modal -->
    <ConceptSettingsModal :visible="showSettingsModal" @save="saveSettings" @cancel="closeSettingsModal" />

    <!-- Edit Ability Modal -->
    <EditAbilityModal v-if="showEditAbilityModal" :ability="selectedAbility" @update="saveEditedAbility"
      @close="closeEditAbilityModal" @delete="deleteAbility" />

    <!-- Edit Equipment Modal -->
    <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="selectedEquipment" @update="saveEditedEquipment"
      @close="closeEditEquipmentModal" @delete="deleteEquipment" />
  </div>

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ConceptTitle from './components/ConceptTitle.vue'
import ConceptDescription from './components/sections/ConceptDescription.vue'
import PhysiologySection from './components/sections/PhysiologySection.vue'
import ConceptAbilitiesSection from './components/sections/ConceptAbilitiesSection.vue'
import ConceptEquipmentSection from './components/sections/ConceptEquipmentSection.vue'
import ConceptImageSection from './components/sections/ConceptImageSection.vue'
import LocalFlavorSection from './components/sections/LocalFlavorSection.vue'
import HooksSection from './components/sections/HooksSection.vue'
import PlaylistSection from './components/sections/PlaylistSection.vue'
import NovizioSection from './components/sections/NovizioSection.vue'
import ConceptSettingsModal from './components/ConceptSettingsModal.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'

// Composables
import { useEditModal } from '@/composables/useEditModal'

// Store imports
import { useConceptsStore } from '@/stores/conceptsStore'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useActionTypesStore } from '@/stores/actionTypesStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useArtStore } from '@/stores/artStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'
import { useProgressiveOptimizedImage } from '@/composables/useOptimizedImage'
import { PROGRESSIVE_IMAGE_CONTEXTS } from '@/constants/imageOptimization'

import { IMAGE_GALLERY_MODES, ART_TYPES } from '@shared/constants/artConstants.js'
import { CONCEPT_LAYOUT_CONFIGS, DEFAULT_LAYOUT_CONFIG } from '@/config/conceptLayoutConfig'

// Props
const _props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
defineEmits(['close'])

// Stores
const conceptsStore = useConceptsStore()
const expansionsStore = useExpansionsStore()
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const keepingStore = useKeepingStore()
const actionTypesStore = useActionTypesStore()
const abilitySchoolsStore = useAbilitySchoolsStore()
const artStore = useArtStore()
const engagementSuccessesStore = useEngagementSuccessesStore()

// Edit modals
const {
  showModal: showEditAbilityModal,
  itemToEdit: selectedAbility,
  openModal: openAbilityModal,
  closeModal: closeEditAbilityModal
} = useEditModal()

const {
  showModal: showEditEquipmentModal,
  itemToEdit: selectedEquipment,
  openModal: openEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

// Local reactive state
const showSettingsModal = ref(false)

// Edit mode state
const isEditMode = ref(false)

const toggleEditMode = (onSave) => {
  if (isEditMode.value && onSave) {
    onSave()
  }
  isEditMode.value = !isEditMode.value
}

const selectedConcept = computed(() => conceptsStore.selectedConcept)

const DETAIL_OVERLAY = 'rgba(0, 0, 0, 0.5)'

const {
  previewUrl: detailBackgroundPreviewUrl,
  finalUrl: detailBackgroundFullUrl,
  isFinalLoaded: isDetailBackgroundLoaded
} = useProgressiveOptimizedImage(
  () => selectedConcept.value?.detailBackgroundImage,
  {
    previewContext: PROGRESSIVE_IMAGE_CONTEXTS.CONCEPT_DETAIL_BACKGROUND.preview,
    finalContext: PROGRESSIVE_IMAGE_CONTEXTS.CONCEPT_DETAIL_BACKGROUND.final
  }
)

const buildDetailBackgroundStyle = (url) => {
  if (!url) return {}
  return {
    backgroundImage: `linear-gradient(${DETAIL_OVERLAY}, ${DETAIL_OVERLAY}), url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}

const detailBackgroundPreviewStyle = computed(() => buildDetailBackgroundStyle(detailBackgroundPreviewUrl.value))
const detailBackgroundFullStyle = computed(() => buildDetailBackgroundStyle(detailBackgroundFullUrl.value))

// Per-type section visibility
const layout = computed(() => {
  const type = selectedConcept.value?.conceptType
  return CONCEPT_LAYOUT_CONFIGS[type] ?? DEFAULT_LAYOUT_CONFIG
})

// Responsive layout
const MOBILE_BREAKPOINT = 1024
const isMobile = ref(false)

const updateLayout = () => {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

const isDesktop = computed(() => !isMobile.value)

// Ability and Equipment modal methods
const saveEditedAbility = async (editedAbility) => {
  await abilitiesStore.update(editedAbility)
  closeEditAbilityModal()
}

const deleteAbility = async (ability) => {
  const updatedAbility = { ...ability, isDeleted: true }
  await abilitiesStore.update(updatedAbility)
  closeEditAbilityModal()
}

const saveEditedEquipment = async (editedEquipment) => {
  await equipmentStore.update(editedEquipment)
  closeEditEquipmentModal()
}

const deleteEquipment = async (equipment) => {
  const updatedEquipment = { ...equipment, isDeleted: true }
  await equipmentStore.update(updatedEquipment)
  closeEditEquipmentModal()
}

const createItemForConcept = async (store, openModal, initialData = {}) => {
  if (!selectedConcept.value) return

  // Create new item with the selected concept as source
  const newItemData = {
    ...initialData,
    source: selectedConcept.value.id
  }

  const newItem = await store.create(newItemData)
  if (newItem) {
    openModal(newItem)
  }
}

const createNewAbility = () => createItemForConcept(
  abilitiesStore,
  openAbilityModal
)

const createNewEquipment = () => createItemForConcept(
  equipmentStore,
  openEquipmentModal
)

// Settings modal methods
const openSettingsModal = () => {
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const saveSettings = async (settings) => {
  if (!selectedConcept.value) return

  if (settings.backgroundImage !== undefined) {
    selectedConcept.value.backgroundImage = settings.backgroundImage
  }
  if (settings.detailBackgroundImage !== undefined) {
    selectedConcept.value.detailBackgroundImage = settings.detailBackgroundImage
  }
  if (settings.expansionId !== undefined) {
    selectedConcept.value.expansion = settings.expansionId
  }

  await conceptsStore.update(selectedConcept.value)
  closeSettingsModal()
}

// Lifecycle
onMounted(async () => {
  updateLayout()
  window.addEventListener('resize', updateLayout)

  await Promise.all([
    expansionsStore.fetch(),
    abilitiesStore.fetch(),
    equipmentStore.fetch(),
    equipmentTypesStore.fetch(),
    equipmentSubtypesStore.fetch(),
    equipmentGradesStore.fetch(),
    equipmentRangesStore.fetch(),
    keepingStore.fetch(),
    actionTypesStore.fetch(),
    abilitySchoolsStore.fetch(),
    artStore.fetch(),
    engagementSuccessesStore.fetch()
  ])
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLayout)
})
</script>

<style scoped>
.concept-content {
  position: relative;
  z-index: var(--z-raised);
  width: var(--concept-modal-width);
  max-width: 91%;
  margin: 0 auto;
}

.concept-detail-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  pointer-events: none;
  overflow: hidden;
}

.concept-detail-bg-layer {
  position: absolute;
  inset: 0;
}

.concept-detail-bg-full {
  opacity: 0;
  transition: opacity 220ms ease;
}

.concept-detail-bg-full.is-loaded {
  opacity: 1;
}

/* Outer wrapper — full-width column of rows */
.concept-layout-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-xl);
  text-align: left;
}

/* Row 1: Art/Novizio (1fr) | Title/Description (2fr) */
.concept-identity-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-xl);
  align-items: start;
}

.concept-art-cell {
  display: flex;
  flex-direction: column;
}

.concept-description-cell {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  background: var(--overlay-black-medium);
  border-radius: var(--radius-10);
  padding: var(--space-lg);
}

/* Equal-column grid row: 3 columns, empty when sections are hidden via v-if */
.concept-grid-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-xl);
  align-items: start;
}

/* Images + Playlist row: fixed 4 columns so sections don't stretch when siblings are hidden */
.concept-grid-row-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-xl);
  align-items: start;
}

/* Local Flavor + Hooks row: fixed 2 columns so sections don't stretch when siblings are hidden */
.concept-grid-row-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-xl);
  align-items: start;
}

.admin-controls {
  position: fixed;
  top: calc(var(--nav-height) + var(--space-lg));
  right: var(--space-lg);
  z-index: var(--z-modal-controls);
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}
</style>
