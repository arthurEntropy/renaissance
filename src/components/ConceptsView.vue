<template>
  <div class="concepts-view">
    <!-- Selection Cards -->
    <div class="concepts-container">
      <ConceptCard v-for="concept in conceptsWithLogo" :key="concept.id" :item="concept" :sources="sources"
        @click="openConceptDetail(concept)" />
      <div class="add-concept-card" @click="createConcept">
        <div class="add-icon">+</div>
        <div class="add-text">Add {{ itemName }}</div>
      </div>
    </div>

    <!-- Concept Detail Modal with Navigation Arrows -->
    <div v-if="showConceptDetail" class="modal-container">
      <button class="navigate-button prev" @click="navigateConcept(-1)" :disabled="!hasPreviousConcept">
        &lsaquo;
      </button>
      <ConceptDetailModal :key="conceptDetailKey" :concept="selectedConcept" :editable="true"
        @close="closeConceptDetail" @update="updateConcept" @edit-ability="editAbility"
        @edit-equipment="editEquipment" />
      <button class="navigate-button next" @click="navigateConcept(1)" :disabled="!hasNextConcept">
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

<script>
import ConceptCard from '@/components/ConceptCard.vue'
import ConceptDetailModal from '@/components/modals/ConceptDetailModal.vue'
import EditAbilityModal from '@/components/modals/EditAbilityModal.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'
import AbilityService from '@/services/AbilityService'
import EquipmentService from '@/services/EquipmentService'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useExpansionStore } from '@/stores/expansionStore'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestiereService from '@/services/MestiereService'
import WorldElementService from '@/services/WorldElementService'

export default {
  props: {
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
  },
  components: {
    ConceptCard,
    ConceptDetailModal,
    EditAbilityModal,
    EditEquipmentModal,
  },
  data() {
    return {
      selectedConcept: null,
      showConceptDetail: false,
      showEditAbilityModal: false,
      selectedAbility: null,
      showEditEquipmentModal: false,
      selectedEquipment: null,
      abilitiesStore: useAbilitiesStore(),
      equipmentStore: useEquipmentStore(),
      expansionStore: useExpansionStore(),
      sources: {
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      },
      expansions: [],
      conceptDetailKey: 0, // for modal refresh
    }
  },
  computed: {
    currentIndex() {
      if (!this.selectedConcept) return -1;
      return this.concepts.findIndex(c => c.id === this.selectedConcept.id);
    },
    hasPreviousConcept() {
      return this.currentIndex > 0;
    },
    hasNextConcept() {
      return this.currentIndex < this.concepts.length - 1 && this.currentIndex >= 0;
    },
    conceptsWithLogo() {
      return this.concepts.map(concept => {
        const expansion = this.expansions.find(e => e.id === concept.expansion)
        return {
          ...concept,
          expansionLogoUrl: expansion && expansion.logoUrl ? expansion.logoUrl : '',
        }
      })
    },
  },
  methods: {
    // Source data fetching
    async fetchSources() {
      try {
        // Fetch all source types in parallel
        const [ancestries, cultures, mestieri, worldElements] = await Promise.all([
          AncestryService.getAllAncestries(),
          CultureService.getAllCultures(),
          MestiereService.getAllMestieri(),
          WorldElementService.getAllWorldElements()
        ]);

        // Update sources
        this.sources = {
          ancestries,
          cultures,
          mestieri,
          worldElements
        };

        // Also update the stores to ensure consistency
        this.abilitiesStore.sources = this.sources;
        this.equipmentStore.sources = this.sources;
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    },

    // CONCEPT CRUD
    async createConcept() {
      try {
        const createdConcept = await this.createConceptFn()
        await this.refreshDataFn()

        // Open the detail view for the new concept
        this.selectedConcept = createdConcept
        this.showConceptDetail = true
      } catch (error) {
        console.error(`Error creating ${this.itemName}:`, error)
      }
    },

    async updateConcept(updatedConcept) {
      try {
        await this.updateConceptFn(updatedConcept)
        // Update the selected concept
        this.selectedConcept = updatedConcept
        // Refresh the list
        await this.refreshDataFn()
      } catch (error) {
        console.error(`Error updating ${this.itemName}:`, error)
      }
    },

    async deleteConcept(concept) {
      try {
        await this.deleteConceptFn(concept)
        // Close the detail view if open
        if (this.selectedConcept?.id === concept.id) {
          this.closeConceptDetail()
        }
        // Refresh the list
        await this.refreshDataFn()
      } catch (error) {
        console.error(`Error deleting ${this.itemName}:`, error)
      }
    },

    // Detail view
    openConceptDetail(concept) {
      this.selectedConcept = concept
      this.showConceptDetail = true
      this.conceptDetailKey++ // force modal refresh
    },
    navigateConcept(direction) {
      if (!this.selectedConcept) return;
      const idx = this.currentIndex;
      const newIndex = idx + direction;
      if (newIndex < 0 || newIndex >= this.concepts.length) return;
      this.selectedConcept = this.concepts[newIndex];
      this.conceptDetailKey++;
    },
    closeConceptDetail() {
      this.selectedConcept = null
      this.showConceptDetail = false
    },

    // Ability editing
    editAbility(ability) {
      this.selectedAbility = ability
      this.showEditAbilityModal = true
    },

    closeEditAbilityModal() {
      this.selectedAbility = null
      this.showEditAbilityModal = false
      // Refresh the data to ensure changes are reflected
      this.abilitiesStore.fetchAllAbilities()
    },

    async saveEditedAbility(editedAbility) {
      try {
        await AbilityService.updateAbility(editedAbility)
        this.closeEditAbilityModal()
      } catch (error) {
        console.error('Error updating ability:', error)
      }
    },

    async deleteAbility(ability) {
      try {
        // Mark as deleted
        const updatedAbility = { ...ability, isDeleted: true }
        await AbilityService.updateAbility(updatedAbility)
        this.closeEditAbilityModal()
      } catch (error) {
        console.error('Error deleting ability:', error)
      }
    },

    // Equipment editing
    editEquipment(equipment) {
      this.selectedEquipment = equipment
      this.showEditEquipmentModal = true
    },

    closeEditEquipmentModal() {
      this.selectedEquipment = null
      this.showEditEquipmentModal = false
      // Refresh the data to ensure changes are reflected
      this.equipmentStore.fetchAllEquipment()
    },

    async saveEditedEquipment(editedEquipment) {
      try {
        await EquipmentService.updateEquipment(editedEquipment)
        this.closeEditEquipmentModal()
      } catch (error) {
        console.error('Error updating equipment:', error)
      }
    },
  },
  async mounted() {
    try {
      await this.expansionStore.fetchExpansions()
      this.expansions = this.expansionStore.expansions
      await this.fetchSources();
      await Promise.all([
        this.abilitiesStore.fetchAllAbilities(),
        this.equipmentStore.fetchAllEquipment()
      ]);
    } catch (error) {
      console.error('Error initializing ConceptsView:', error);
    }
  },
}
</script>

<style scoped>
.concepts-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
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
