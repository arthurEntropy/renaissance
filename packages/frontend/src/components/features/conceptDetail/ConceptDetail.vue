<template>
  <div class="modal-overlay" @click.self="handleClose">
    <!-- Admin Controls -->
    <ConceptHeader :editable="editable" :is-edit-mode="isEditMode" @toggle-edit-mode="handleToggleEditMode"
      @open-settings="openSettingsModal" />

    <div class="modal-content">
      <!-- Desktop Layout: Left/Right Columns -->
      <div v-if="isDesktop" class="concept-layout-desktop">
        <!-- Left Column -->
        <LeftColumn :is-edit-mode="isEditMode" @unsaved-changes="onSectionUnsavedChanges"
          @reset-unsaved-changes="onSectionResetUnsavedChanges" />

        <!-- Right Column -->
        <RightColumn :abilities="abilities" :equipment="equipment" :sources="sources" :is-edit-mode="isEditMode"
          :expansion="expansion" :character="selectedCharacter" @edit-ability="emitAbilityEdit"
          @edit-equipment="emitEquipmentEdit" @add-ability="createNewAbility" @add-equipment="createNewEquipment"
          @unsaved-changes="onSectionUnsavedChanges" @reset-unsaved-changes="onSectionResetUnsavedChanges" />
      </div>

      <!-- Mobile Layout: Single Column -->
      <MobileLayout v-else :abilities="abilities" :equipment="equipment" :sources="sources" :is-edit-mode="isEditMode"
        :expansion="expansion" :character="selectedCharacter" @edit-ability="emitAbilityEdit"
        @edit-equipment="emitEquipmentEdit" @add-ability="createNewAbility" @add-equipment="createNewEquipment"
        @unsaved-changes="onSectionUnsavedChanges" @reset-unsaved-changes="onSectionResetUnsavedChanges" />
    </div>

    <!-- Settings Modal -->
    <ConceptSettingsModal :visible="showSettingsModal" :settings="tempSettings" @update:settings="tempSettings = $event"
      @save="saveSettings" @cancel="closeSettingsModal" />

    <!-- Edit Ability Modal -->
    <EditAbilityModal v-if="showEditAbilityModal" :ability="selectedAbility" :sources="sources"
      @update="saveEditedAbility" @close="closeEditAbilityModal" @delete="deleteAbility" />

    <!-- Edit Equipment Modal -->
    <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="selectedEquipment" :sources="sources"
      @update="saveEditedEquipment" @close="closeEditEquipmentModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ConceptHeader from './components/ConceptHeader.vue'
import LeftColumn from './components/layouts/LeftColumn.vue'
import RightColumn from './components/layouts/RightColumn.vue'
import MobileLayout from './components/layouts/MobileLayout.vue'
import ConceptSettingsModal from './components/ConceptSettingsModal.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'

// Composables
import { useConceptEditMode } from './composables/useConceptEditMode'
import { useConceptData } from './composables/useConceptData'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useEditModal } from '@/composables/useEditModal'

// Store imports
import { useConceptsStore } from '@/stores/conceptsStore'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useArtStore } from '@/stores/artStore'
import { useCharactersStore } from '@/stores/charactersStore'

// Service imports
import AbilityService from '@/services/entities/abilityService'
import EquipmentService from '@/services/entities/equipment/equipmentService'

// Props
const _props = defineProps({
  itemName: {
    type: String,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['close', 'edit-mode-change'])

// Stores
const conceptsStore = useConceptsStore()
const expansionStore = useExpansionsStore()
const sourcesStore = useSourcesStore()
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const artStore = useArtStore()

// Store data
const sources = computed(() => {
  const storeData = sourcesStore.sources
  if (!storeData) return []

  return [
    ...(storeData.ancestries || []),
    ...(storeData.cultures || []),
    ...(storeData.mestieri || []),
    ...(storeData.worldElements || [])
  ]
})

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
const tempSettings = ref({
  backgroundImage: '',
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
// Get selected character from store
const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

// Get concept from unified concepts store (reactive ref, can be mutated directly)
const concept = computed(() => conceptsStore.selectedItem)

const {
  abilities,
  equipment,
  refreshData
} = useConceptData(concept)

// Responsive layout
const isMobile = ref(false)
const breakpoint = 1024

const updateLayout = () => {
  isMobile.value = window.innerWidth < breakpoint
}

const isDesktop = computed(() => !isMobile.value)

// Computed properties
const expansion = computed(() => {
  if (!concept.value?.expansion) return null
  return expansions.value.find(e => e.id === concept.value.expansion) || null
})

// Methods
const handleToggleEditMode = () => {
  toggleEditMode()
  emit('edit-mode-change', isEditMode.value)
}

const handleClose = () => {
  const hasChanges = hasUnsavedChanges.value || hasUnsavedSectionChanges.value

  if (hasChanges) {
    confirmIfUnsaved(() => emit('close'), 'You have unsaved changes. Are you sure you want to exit?')
  } else {
    emit('close')
  }
}

const emitAbilityEdit = (ability) => {
  if (!isEditMode.value) return
  openAbilityModal(ability)
}

const emitEquipmentEdit = (equipmentItem) => {
  if (!isEditMode.value) return
  openEquipmentModal(equipmentItem)
}

const saveEditedAbility = async (editedAbility) => {
  try {
    await AbilityService.update(editedAbility)
    closeEditAbilityModal()
    await abilitiesStore.fetch()
    refreshData()
  } catch (error) {
    console.error('Error updating ability:', error)
  }
}

const deleteAbility = async (ability) => {
  try {
    const updatedAbility = { ...ability, isDeleted: true }
    await AbilityService.update(updatedAbility)
    closeEditAbilityModal()
    await abilitiesStore.fetch()
    refreshData()
  } catch (error) {
    console.error('Error deleting ability:', error)
  }
}

const saveEditedEquipment = async (editedEquipment) => {
  try {
    await EquipmentService.update(editedEquipment)
    closeEditEquipmentModal()
    await equipmentStore.fetch()
    refreshData()
  } catch (error) {
    console.error('Error updating equipment:', error)
  }
}

// Settings modal methods
const openSettingsModal = () => {
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const saveSettings = () => {
  if (!concept.value) return

  if (tempSettings.value.backgroundImage) {
    concept.value.backgroundImage = tempSettings.value.backgroundImage
  }
  if (tempSettings.value.expansionId) {
    concept.value.expansion = tempSettings.value.expansionId
  }
  closeSettingsModal()
}

// Lifecycle
onMounted(async () => {
  updateLayout()
  window.addEventListener('resize', updateLayout)

  try {
    await sourcesStore.fetchSources()
    await expansionStore.fetch()
    expansions.value = expansionStore.items
    await artStore.fetch()
  } catch (error) {
    console.error('Error initializing ConceptDetail:', error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLayout)
})

// Create new abilities and equipment with concept as source
const createNewAbility = async () => {
  try {
    if (!concept.value) return

    // Create a new ability with the concept as the source
    const newAbilityData = {
      ...AbilityService.getDefaultEntity(),
      source: concept.value.id
    }

    const newAbility = await AbilityService.create(newAbilityData)
    await abilitiesStore.fetch()
    refreshData()

    // Find the created ability and open the edit modal
    const createdAbility = abilitiesStore.abilities.find(
      (ability) => ability.id === newAbility.id
    )

    if (createdAbility) {
      openAbilityModal(createdAbility)
    }
  } catch (error) {
    console.error('Error creating new ability:', error)
  }
}

const createNewEquipment = async () => {
  try {
    if (!concept.value) return

    // Create a new equipment with the concept as the source
    const newEquipmentData = {
      ...EquipmentService.getDefaultEntity(),
      source: concept.value.id
    }

    const newEquipment = await EquipmentService.create(newEquipmentData)
    await equipmentStore.fetch()
    refreshData()

    // Find the created equipment and open the edit modal
    const createdEquipment = equipmentStore.equipment.find(
      (item) => item.id === newEquipment.id
    )

    if (createdEquipment) {
      openEquipmentModal(createdEquipment)
    }
  } catch (error) {
    console.error('Error creating new equipment:', error)
  }
}
</script>

<style scoped>
/* Component-specific overrides */
.modal-content {
  max-width: 1275px;
  border: none;
}

/* Global styles */
:global(body.modal-open) {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
</style>
