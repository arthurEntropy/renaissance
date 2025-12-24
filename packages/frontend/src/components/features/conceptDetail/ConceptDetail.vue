<template>
  <div class="modal-overlay" @click.self="handleClose">
    <!-- Admin Controls -->
    <div class="admin-controls">
      <FloatingActionButton v-if="isEditMode" type="settings" size="large" visibility="always"
        @click="openSettingsModal" />
      <FloatingActionButton v-if="editable" type="edit" size="large" visibility="always" :is-active="isEditMode"
        @click="() => toggleEditMode()" />
    </div>

    <div class="modal-content">
      <!-- Desktop Layout: Left/Right Columns -->
      <div v-if="isDesktop" class="concept-layout-desktop">
        <!-- Left Column -->
        <div class="concept-column-left">
          <ConceptImageSection title="Featured Art" :show-title="false" :is-edit-mode="isEditMode"
            :mode="IMAGE_GALLERY_MODES.MANUAL" />
          <NovizioSection :editable="isEditMode" />
          <ConceptImageSection title="Faces" :is-edit-mode="isEditMode" :mode="IMAGE_GALLERY_MODES.AUTO"
            :auto-source-type="ART_TYPES.FACES" />
          <ConceptImageSection title="Places" :is-edit-mode="isEditMode" mode="auto" auto-source-type="places" />
          <ConceptImageSection title="Maps" :is-edit-mode="isEditMode" mode="auto" auto-source-type="maps" />
          <PlaylistSection :editable="isEditMode" />
        </div>

        <!-- Right Column -->
        <div class="concept-column-right">
          <ConceptTitle :is-edit-mode="isEditMode" />
          <ConceptDescription :is-edit-mode="isEditMode" />
          <ConceptAbilitiesSection :is-edit-mode="isEditMode" @edit-ability="openAbilityModal"
            @add-ability="createNewAbility" />
          <LocalFlavorSection :editable="isEditMode" />
          <HooksSection :editable="isEditMode" />
          <ConceptEquipmentSection :is-edit-mode="isEditMode" @edit-equipment="openEquipmentModal"
            @add-equipment="createNewEquipment" />
        </div>
      </div>

      <!-- Mobile Layout: Single Column -->
      <div v-else class="concept-layout-mobile">
        <ConceptImageSection title="Featured Art" :show-title="false" :is-edit-mode="isEditMode"
          :mode="IMAGE_GALLERY_MODES.MANUAL" />
        <ConceptTitle :is-edit-mode="isEditMode" />
        <ConceptDescription :is-edit-mode="isEditMode" />
        <ConceptAbilitiesSection :is-edit-mode="isEditMode" @edit-ability="openAbilityModal"
          @add-ability="createNewAbility" />
        <ConceptImageSection title="Faces" :is-edit-mode="isEditMode" :mode="IMAGE_GALLERY_MODES.AUTO"
          :auto-source-type="ART_TYPES.PLACES" />
        <HooksSection :editable="isEditMode" />
        <ConceptImageSection title="Maps" :is-edit-mode="isEditMode" :mode="IMAGE_GALLERY_MODES.AUTO"
          :auto-source-type="ART_TYPES.PLACES" />
        <ConceptImageSection title="Maps" :is-edit-mode="isEditMode" :mode="IMAGE_GALLERY_MODES.AUTO"
          :auto-source-type="ART_TYPES.MAPS" />
        <HooksSection :editable="isEditMode" @unsaved-changes="onSectionUnsavedChanges"
          @reset-unsaved-changes="onSectionResetUnsavedChanges" />
        <ConceptEquipmentSection :is-edit-mode="isEditMode" @edit-equipment="openEquipmentModal"
          @add-equipment="createNewEquipment" />
        <PlaylistSection :editable="isEditMode" />
        <NovizioSection :editable="isEditMode" />
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
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useEditModal } from '@/composables/useEditModal'

// Store imports
import { useConceptsStore } from '@/stores/conceptsStore'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useArtStore } from '@/stores/artStore'

// Service imports
import AbilityService from '@/services/entities/abilityService'
import EquipmentService from '@/services/entities/equipment/equipmentService'
import { IMAGE_GALLERY_MODES, ART_TYPES } from '@shared/constants/artConstants.js'

// Props
const _props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['close'])

// Stores
const conceptsStore = useConceptsStore()
const expansionsStore = useExpansionsStore()
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const artStore = useArtStore()

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
const hasUnsavedSectionChanges = ref(false)

const toggleEditMode = (onSave) => {
  if (isEditMode.value && onSave) {
    onSave()
  }
  isEditMode.value = !isEditMode.value
}

const onSectionUnsavedChanges = (hasChanges) => {
  hasUnsavedSectionChanges.value = hasChanges
}

const onSectionResetUnsavedChanges = () => {
  hasUnsavedSectionChanges.value = false
}

const {
  confirmIfUnsaved
} = useUnsavedChanges(emit, () => hasUnsavedSectionChanges.value)

const selectedConcept = computed(() => conceptsStore.selectedConcept)

// Responsive layout
const MOBILE_BREAKPOINT = 1024
const isMobile = ref(false)

const updateLayout = () => {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

const isDesktop = computed(() => !isMobile.value)

// Methods
const handleClose = () => {
  confirmIfUnsaved(() => emit('close'))
}

// Ability and Equipment modal methods
const saveEditedAbility = async (editedAbility) => {
  await AbilityService.update(editedAbility)
  closeEditAbilityModal()
  await abilitiesStore.fetch()
}

const deleteAbility = async (ability) => {
  const updatedAbility = { ...ability, isDeleted: true }
  await AbilityService.update(updatedAbility)
  closeEditAbilityModal()
  await abilitiesStore.fetch()
}

const saveEditedEquipment = async (editedEquipment) => {
  await EquipmentService.update(editedEquipment)
  closeEditEquipmentModal()
  await equipmentStore.fetch()
}

const deleteEquipment = async (equipment) => {
  const updatedEquipment = { ...equipment, isDeleted: true }
  await EquipmentService.update(updatedEquipment)
  closeEditEquipmentModal()
  await equipmentStore.fetch()
}

const createItemForConcept = async (service, store, storeItems, openModal) => {
  if (!selectedConcept.value) return

  // Create new item with the selected concept as source
  const newItemData = {
    ...service.getDefaultEntity(),
    source: selectedConcept.value.id
  }

  const newItem = await service.create(newItemData)
  await store.fetch()

  const createdItem = storeItems.find(item => item.id === newItem.id)
  if (createdItem) {
    openModal(createdItem)
  }
}

const createNewAbility = () => createItemForConcept(
  AbilityService,
  abilitiesStore,
  abilitiesStore.abilities,
  openAbilityModal
)

const createNewEquipment = () => createItemForConcept(
  EquipmentService,
  equipmentStore,
  equipmentStore.equipment,
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
    artStore.fetch()
  ])
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLayout)
})
</script>

<style scoped>
.admin-controls {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: var(--z-modal-controls);
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}
</style>
