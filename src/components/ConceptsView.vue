<template>
    <div class="concepts-view">
      <div class="selection-cards-container">
        <SelectionCard 
          v-for="concept in concepts" 
          :key="concept.id" 
          :item="concept" 
          @select="selectConcept(concept)"
        />

        <!-- "Add" card with plus icon -->
        <div class="add-concept-card" @click="createNewConcept">
            <div class="add-icon">+</div>
            <div class="add-text">Add {{ itemName }}</div>
        </div>
      </div>
      
      <!-- Concept Detail Modal with Navigation Arrows -->
      <div v-if="selectedConcept" class="modal-container">
        <button 
          class="navigate-button prev" 
          @click="navigateConcept(-1)" 
          :disabled="!hasPreviousConcept"
        >
          &lsaquo;
        </button>
        
        <ConceptDetail 
        :key="conceptDetailKey"
        :concept="selectedConcept" 
        @close="deselectConcept" 
        @update="updateConceptFromDetail"
        @edit-ability="openEditAbilityModal"
        @edit-equipment="openEditEquipmentModal"
        @delete-ability="openDeleteConfirmationModalForAbility"
        />
        
        <button 
          class="navigate-button next" 
          @click="navigateConcept(1)"
          :disabled="!hasNextConcept"
        >
          &rsaquo;
        </button>
      </div>
  
      <!-- Edit Ability Modal -->
      <EditAbilityModal 
        v-if="showEditAbilityModal"
        :ability="selectedAbility"
        @update="updateEditedAbility"
        @close="closeEditAbilityModal"
        @delete="openDeleteConfirmationModalForAbility"
      />
  
      <!-- Edit Equipment Modal -->
      <EditEquipmentModal 
        v-if="showEditEquipmentModal"
        :equipment="selectedEquipment"
        @update="updateEditedEquipment"
        @close="closeEditEquipmentModal"
        @delete="openDeleteConfirmationModalForEquipment"
      />
  
      <!-- Delete Confirmation Modal -->
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="getDeleteModalName()"
        @close="closeDeleteConfirmationModal" 
        @confirm="confirmDelete"
      />
    </div>
  </template>
  
  <script>
  import AbilityService from '@/services/AbilityService';
  import ConceptDetail from '@/components/modals/ConceptDetailModal.vue';
  import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
  import EditAbilityModal from '@/components/modals/EditAbilityModal.vue';
  import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue';
  import EquipmentService from '@/services/EquipmentService';
  import SelectionCard from '@/components/ConceptCard.vue';
  
  export default {
    name: 'ConceptsView',
    components: {
      ConceptDetail,
      DeleteConfirmationModal,
      EditAbilityModal,
      EditEquipmentModal,
      SelectionCard,
    },
    props: {
      itemName: {
        type: String,
        required: true
      },
      concepts: {
        type: Array,
        required: true
      },
      // Service functions
      createConceptFn: {
        type: Function,
        required: true
      },
      updateConceptFn: {
        type: Function,
        required: true
      },
      deleteConceptFn: {
        type: Function,
        required: true
      },
      refreshDataFn: {
        type: Function,
        required: true
      }
    },
    data() {
      return {
        selectedConcept: null,
        selectedAbility: null,
        selectedEquipment: null,
        showEditAbilityModal: false,
        showEditEquipmentModal: false,
        showDeleteConfirmationModal: false,
        isDeleting: null, // 'concept', 'ability', or 'equipment'
        conceptDetailKey: 0,
      };
    },
    computed: {
      // Current concept index
      currentIndex() {
        if (!this.selectedConcept) return -1;
        return this.concepts.findIndex(c => c.id === this.selectedConcept.id);
      },
      
      // Navigation status
      hasPreviousConcept() {
        return this.currentIndex > 0;
      },
      
      hasNextConcept() {
        return this.currentIndex < this.concepts.length - 1 && this.currentIndex >= 0;
      }
    },
    methods: {
      // CONCEPT SELECTION & NAVIGATION
      selectConcept(concept) {
        this.selectedConcept = concept;
      },
      
      deselectConcept() {
        this.selectedConcept = null;
        this.refreshDataFn();
      },
      
      navigateConcept(direction) {
        if (direction < 0 && !this.hasPreviousConcept) return;
        if (direction > 0 && !this.hasNextConcept) return;
        
        const newIndex = this.currentIndex + direction;
        this.selectedConcept = this.concepts[newIndex];
        this.conceptDetailKey++; // Force refresh of concept detail view
      },
      
      async createNewConcept() {
        try {
          const newConcept = await this.createConceptFn();
          await this.refreshDataFn();
          
          // Find the newest concept in the refreshed list
          const createdConcept = this.concepts.find(c => c.id === newConcept.id);
          if (createdConcept) {
            this.selectConcept(createdConcept);
          }
        } catch (error) {
          console.error(`Error creating new ${this.itemName}:`, error);
        }
      },
  
      // CONCEPT MODAL CONTROLS
      async updateEditedConcept(updatedConcept) {
        await this.updateConceptFn(updatedConcept);
        await this.refreshDataFn();
        
        // Find the updated concept in the refreshed list
        const refreshedConcept = this.concepts.find(c => c.id === updatedConcept.id);
        if (refreshedConcept) {
          this.selectedConcept = refreshedConcept;
        }
        
        this.conceptDetailKey++; // Force refresh of concept detail
      },
      
      async updateConceptFromDetail(updatedConcept) {
      try {
        // Call the update function passed as prop
        await this.updateConceptFn(updatedConcept);
        
        // Update the selected concept to reflect changes immediately
        this.selectedConcept = updatedConcept;
        
        // No need to refresh all data for minor updates
        // This helps avoid selection issues and performance problems
        console.log(`Updated ${this.itemName}: ${updatedConcept.id}`);
      } catch (error) {
        console.error(`Error updating ${this.itemName}:`, error);
      }
    },
      
      // ABILITY CONTROLS
      openEditAbilityModal(ability) {
        this.selectedAbility = ability;
        this.showEditAbilityModal = true;
      },
      
      closeEditAbilityModal() {
        this.selectedAbility = null;
        this.showEditAbilityModal = false;
      },
      
      async updateEditedAbility(updatedAbility) {
        try {
          await AbilityService.updateAbility(updatedAbility);
          this.closeEditAbilityModal();
          await this.refreshDataFn();
          this.conceptDetailKey++; // Force refresh of concept detail
        } catch (error) {
          console.error('Error updating ability:', error);
        }
      },
  
      // EQUIPMENT CONTROLS
      openEditEquipmentModal(equipment) {
        this.selectedEquipment = equipment;
        this.showEditEquipmentModal = true;
      },
      
      closeEditEquipmentModal() {
        this.selectedEquipment = null;
        this.showEditEquipmentModal = false;
      },
      
      async updateEditedEquipment(updatedEquipment) {
        try {
          await EquipmentService.updateEquipment(updatedEquipment);
          this.closeEditEquipmentModal();
          await this.refreshDataFn();
          this.conceptDetailKey++; // Force refresh of concept detail
        } catch (error) {
          console.error('Error updating equipment:', error);
        }
      },
  
      // DELETE CONFIRMATION CONTROLS
      openDeleteConfirmationModalForConcept() {
        this.isDeleting = 'concept';
        this.showDeleteConfirmationModal = true;
      },
      
      openDeleteConfirmationModalForAbility(ability) {
        this.selectedAbility = ability;
        this.isDeleting = 'ability';
        this.showDeleteConfirmationModal = true;
      },
      
      openDeleteConfirmationModalForEquipment(equipment) {
        this.selectedEquipment = equipment;
        this.isDeleting = 'equipment';
        this.showDeleteConfirmationModal = true;
      },
      
      closeDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = false;
        this.isDeleting = null;
      },
      
      getDeleteModalName() {
        if (this.isDeleting === 'ability' && this.selectedAbility) {
          return this.selectedAbility.name;
        } else if (this.isDeleting === 'equipment' && this.selectedEquipment) {
          return this.selectedEquipment.name;
        } else if (this.selectedConcept) {
          return this.selectedConcept.name;
        }
        return '';
      },
  
      async confirmDelete() {
        try {
          if (this.isDeleting === 'ability' && this.selectedAbility) {
            await AbilityService.deleteAbility(this.selectedAbility);
            this.closeDeleteConfirmationModal();
            this.closeEditAbilityModal();
            this.conceptDetailKey++; // Force refresh
            
          } else if (this.isDeleting === 'equipment' && this.selectedEquipment) {
            await EquipmentService.deleteEquipment(this.selectedEquipment);
            this.closeDeleteConfirmationModal();
            this.closeEditEquipmentModal();
            this.conceptDetailKey++; // Force refresh
            
          } else if (this.isDeleting === 'concept' && this.selectedConcept) {
            await this.deleteConceptFn(this.selectedConcept);
            this.closeDeleteConfirmationModal();
            this.deselectConcept();
          }
          
          await this.refreshDataFn();
        } catch (error) {
          console.error(`Error deleting ${this.isDeleting}:`, error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .concepts-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    flex-grow: 1;
    position: relative;
  }
  
  .selection-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 50px;
    width: 90%;
  }

  .add-concept-card {
    width: 240px;
    height: 275px;
    background: rgba(0, 0, 0, 0.4);
    margin: 10px 0 0 15px;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
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
  
  /* Responsive adjustments */
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