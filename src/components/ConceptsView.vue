<template>
  <div class="concepts-view">
    <!-- Filter Controls -->
    <div class="filter-controls">
      <input type="text" v-model="searchQuery" class="search-input" placeholder="Search..." />
      <select v-model="expansionFilter" class="expansion-filter">
        <option value="">All Expansions</option>
        <option v-for="exp in expansions" :key="exp.id" :value="exp.id">{{ exp.name }}</option>
      </select>
    </div>

    <!-- Selection Cards -->
    <div class="concepts-container">
      <ConceptCard v-for="concept in filteredConcepts" :key="concept.id" :item="concept" :sources="sources"
        @click="openConceptDetail(concept)" />
      <div class="add-concept-card" @click="createConcept">
        <div class="add-icon">+</div>
        <div class="add-text">Add {{ itemName }}</div>
      </div>
    </div>

    <!-- Concept Detail Modal with Navigation Arrows -->
    <div v-if="showConceptDetail" class="modal-container">
      <button class="navigate-button prev" @click="navigateConcept(-1)" :disabled="!hasPreviousConcept"
        :title="hasPreviousConcept ? 'Previous (← Left Arrow)' : 'No previous item'">
        &lsaquo;
      </button>
      <ConceptDetailModal :key="conceptDetailKey" :concept="selectedConcept" :editable="true"
        @close="closeConceptDetail" @update="updateConcept" @edit-ability="editAbility"
        @edit-equipment="editEquipment" />
      <button class="navigate-button next" @click="navigateConcept(1)" :disabled="!hasNextConcept"
        :title="hasNextConcept ? 'Next (→ Right Arrow)' : 'No next item'">
        &rsaquo;
      </button>
    </div>

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
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useExpansionStore } from '@/stores/expansionStore'
import { useEditModal } from '@/composables/useEditModal'
import { useSources } from '@/composables/useSources'
import ConceptCard from '@/components/ConceptCard.vue'
import ConceptDetailModal from '@/components/modals/ConceptDetailModal.vue'
import EditAbilityModal from '@/components/modals/EditAbilityModal.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'
import AbilityService from '@/services/AbilityService'
import EquipmentService from '@/services/EquipmentService'

// Props
const props = defineProps({
  itemName: {
    type: String,
    required: true,
  },
  concepts: {
    type: Array,
    default: () => [],
  },
  createConceptFn: {
    type: Function,
    required: true,
  },
  updateConceptFn: {
    type: Function,
    required: true,
  },
  deleteConceptFn: {
    type: Function,
    required: true,
  },
  refreshDataFn: {
    type: Function,
    required: true,
  },
})

// Stores
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const expansionStore = useExpansionStore()

// Modal management using composables
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

// Sources management
const { sources } = useSources()

// Reactive state
const selectedConcept = ref(null)
const showConceptDetail = ref(false)
const expansions = ref([])
const conceptDetailKey = ref(0)
const searchQuery = ref('')
const expansionFilter = ref('')

// Computed properties
const currentIndex = computed(() => {
  if (!selectedConcept.value) return -1;
  return props.concepts.findIndex(c => c.id === selectedConcept.value.id);
})

const hasPreviousConcept = computed(() => {
  return currentIndex.value > 0;
})

const hasNextConcept = computed(() => {
  return currentIndex.value < props.concepts.length - 1 && currentIndex.value >= 0;
})

const conceptsWithLogo = computed(() => {
  return props.concepts.map(concept => {
    const expansion = expansions.value.find(e => e.id === concept.expansion)
    return {
      ...concept,
      expansionLogoUrl: expansion && expansion.logoUrl ? expansion.logoUrl : '',
    }
  })
})

const filteredConcepts = computed(() => {
  let filtered = conceptsWithLogo.value
  if (expansionFilter.value) {
    filtered = filtered.filter(c => c.expansion === expansionFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    )
  }
  return filtered
})

// CONCEPT CRUD
const createConcept = async () => {
  try {
    const createdConcept = await props.createConceptFn()
    await props.refreshDataFn()

    // Open the detail view for the new concept
    selectedConcept.value = createdConcept
    showConceptDetail.value = true
  } catch (error) {
    console.error(`Error creating ${props.itemName}:`, error)
  }
}

const updateConcept = async (updatedConcept) => {
  try {
    await props.updateConceptFn(updatedConcept)
    // Update the selected concept
    selectedConcept.value = updatedConcept
    // Refresh the list
    await props.refreshDataFn()
  } catch (error) {
    console.error(`Error updating ${props.itemName}:`, error)
  }
}

// Deleting a concept is a rare operation, so we'll just manually delete the data file for now.
// const deleteConcept = async (concept) => {
//   try {
//     await props.deleteConceptFn(concept)
//     // Close the detail view if open
//     if (selectedConcept.value?.id === concept.id) {
//       closeConceptDetail()
//     }
//     // Refresh the list
//     await props.refreshDataFn()
//   } catch (error) {
//     console.error(`Error deleting ${props.itemName}:`, error)
//   }
// }

// Detail view
const openConceptDetail = (concept) => {
  selectedConcept.value = concept
  showConceptDetail.value = true
  conceptDetailKey.value++ // force modal refresh
}

const navigateConcept = (direction) => {
  if (!selectedConcept.value) return;
  const idx = currentIndex.value;
  const newIndex = idx + direction;
  if (newIndex < 0 || newIndex >= props.concepts.length) return;
  selectedConcept.value = props.concepts[newIndex];
  conceptDetailKey.value++;
}

const closeConceptDetail = () => {
  selectedConcept.value = null
  showConceptDetail.value = false
}

// Ability editing
const editAbility = (ability) => {
  openAbilityModal(ability)
}

const saveEditedAbility = async (editedAbility) => {
  try {
    await AbilityService.updateAbility(editedAbility)
    closeEditAbilityModal()
    // Refresh the data to ensure changes are reflected
    abilitiesStore.fetchAllAbilities()
  } catch (error) {
    console.error('Error updating ability:', error)
  }
}

const deleteAbility = async (ability) => {
  try {
    // Mark as deleted
    const updatedAbility = { ...ability, isDeleted: true }
    await AbilityService.updateAbility(updatedAbility)
    closeEditAbilityModal()
  } catch (error) {
    console.error('Error deleting ability:', error)
  }
}

// Equipment editing
const editEquipment = (equipment) => {
  openEquipmentModal(equipment)
}

const saveEditedEquipment = async (editedEquipment) => {
  try {
    await EquipmentService.updateEquipment(editedEquipment)
    closeEditEquipmentModal()
    // Refresh the data to ensure changes are reflected
    equipmentStore.fetchAllEquipment()
  } catch (error) {
    console.error('Error updating equipment:', error)
  }
}

// Keyboard navigation
const handleKeyNavigation = (event) => {
  // Only process keyboard navigation when concept detail is shown
  if (!showConceptDetail.value) return;

  // Ignore keyboard events when user is in an input field
  if (event.target.tagName === 'INPUT' ||
    event.target.tagName === 'TEXTAREA' ||
    event.target.isContentEditable) {
    return;
  }

  switch (event.key) {
    case 'ArrowLeft':
      if (hasPreviousConcept.value) {
        navigateConcept(-1);
      }
      break;
    case 'ArrowRight':
      if (hasNextConcept.value) {
        navigateConcept(1);
      }
      break;
    case 'Escape':
      closeConceptDetail();
      break;
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await expansionStore.fetchExpansions()
    expansions.value = expansionStore.expansions
    // Sources will auto-fetch via useSources composable
    await Promise.all([
      abilitiesStore.fetchAllAbilities(),
      equipmentStore.fetchAllEquipment()
    ]);
    window.addEventListener('keydown', handleKeyNavigation);
  } catch (error) {
    console.error('Error initializing ConceptsView:', error);
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyNavigation);
})
</script>

<style scoped>
.concepts-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 60%;
  margin-bottom: 1rem;
  padding: 0 2rem;
  z-index: 1;
}

.search-input {
  flex: 2;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
}

.expansion-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  color: white;
}

.expansion-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus,
.expansion-filter:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

.concepts-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 50px;
}

.add-concept-card {
  width: 250px;
  height: 270px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 10px;
}

.add-concept-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.add-icon {
  font-size: 3rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.add-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

/* Navigation styling */
.modal-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 1000;
}

.navigate-button {
  position: fixed;
  top: 50%;
  padding-bottom: 7px;
  transform: translateY(-50%);
  background: rgba(20, 20, 20, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1100;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}

.navigate-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.navigate-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.navigate-button.prev {
  left: 30px;
}

.navigate-button.next {
  right: 30px;
}

@media (max-width: 650px) {
  .add-concept-card {
    width: 80%;
    margin-left: 10px;
    margin-right: 10px;
  }
}

@media (max-width: 768px) {
  .navigate-button {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .navigate-button.prev {
    left: 5px;
  }

  .navigate-button.next {
    right: 5px;
  }
}
</style>
