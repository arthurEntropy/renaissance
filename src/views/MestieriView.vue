<template>
    <div class="mestiere-selection">
      <h2>MESTIERI</h2>
      <button class="button button-primary create-new-button" @click="createNewMestiere">New Mestiere</button>
      <div class="selection-cards-container">
        <SelectionCard 
          v-for="mestiere in mestieri" 
          :key="mestiere.id" 
          :item="mestiere" 
          @select="selectMestiere(mestiere)"
        />
      </div>
      
      <!-- Concept Detail Modal -->
      <ConceptDetail 
        v-if="selectedMestiere" 
        :concept="selectedMestiere" 
        @close="deselectMestiere" 
        @edit="openEditConceptModal"
        @edit-ability="openEditAbilityModal"
        @delete-ability="openDeleteConfirmationModalForAbility"
      />
  
      <!-- Edit Concept Modal -->
      <EditConceptModal 
        v-if="showEditConceptModal"
        :concept="selectedMestiere"
        @update="updateEditedConcept"
        @close="closeEditConceptModal"
        @delete="openDeleteConfirmationModalForMestiere"
      />
  
      <!-- Edit Ability Modal -->
      <EditAbilityModal 
        v-if="showEditAbilityModal"
        :ability="selectedAbility"
        @update="updateEditedAbility"
        @close="closeEditAbilityModal"
        @delete="openDeleteConfirmationModalForAbility"
      />
  
      <!-- Delete Confirmation Modal -->
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="isDeletingAbility ? selectedAbility.name : selectedMestiere.name"
        @close="closeDeleteConfirmationModal" 
        @confirm="confirmDelete"
      />
    </div>
  </template>
  
  <script>
  import { useMestieriStore } from '@/stores/mestieriStore';
  import { mapState } from 'pinia';
  import MestieriService from '@/services/MestieriService';
  import AbilityService from '@/services/AbilityService';
  import SelectionCard from '@/components/ConceptCard.vue';
  import ConceptDetail from '@/components/modals/ConceptDetailModal.vue';
  import EditConceptModal from '@/components/modals/EditConceptModal.vue';
  import EditAbilityModal from '@/components/modals/EditAbilityModal.vue';
  import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
  
  export default {
    components: {
      SelectionCard,
      ConceptDetail,
      EditConceptModal,
      EditAbilityModal,
      DeleteConfirmationModal,
    },
    data() {
      return {
        mestieriStore: useMestieriStore(),
        selectedMestiere: null,
        selectedAbility: null, // Track the ability being edited or deleted
        showEditConceptModal: false,
        showEditAbilityModal: false,
        showDeleteConfirmationModal: false,
        isDeletingAbility: false, // Track whether we're deleting an ability
      };
    },
    computed: {
      ...mapState(useMestieriStore, ['mestieri']),
      mestieri() {
        return this.mestieriStore.mestieri;
      },
    },
    methods: {
      // MESTIERE SELECTION & CRUD
      selectMestiere(mestiere) {
        this.selectedMestiere = mestiere;
      },
      deselectMestiere() {
        this.selectedMestiere = null;
        this.mestieriStore.selectedMestiere = null;
        this.mestieriStore.fetchMestieri();
      },
      async createNewMestiere() {
        const createdMestiere = await MestieriService.createMestiere();
        await this.mestieriStore.fetchMestieri();
        const newMestiere = this.mestieriStore.mestieri.find(
          (mestiere) => mestiere.id === createdMestiere.id
        );
        this.selectMestiere(newMestiere);
      },
      updateMestiere(updatedMestiere) {
        MestieriService.saveMestiere(updatedMestiere);
        this.mestieriStore.fetchMestieri();
        this.selectedMestiere = updatedMestiere;
      },
  
      // MODAL CONTROLS
      closeAllModalsAndDeselectMestiere() {
        this.showEditConceptModal = false;
        this.showEditAbilityModal = false;
        this.showDeleteConfirmationModal = false;
        this.deselectMestiere();
      },
      refreshConceptDetailModal() {
        var selectedMestiere = this.selectedMestiere;
        this.selectedMestiere = null;
        // TODO: better solution for this issue
        setTimeout(() => {
          this.selectedMestiere = selectedMestiere;
        }, 1);
      },
      openEditConceptModal() {
        this.showEditConceptModal = true;
      },
      closeEditConceptModal() {
        this.showEditConceptModal = false;
      },
      updateEditedConcept(updatedConcept) {
        this.updateMestiere(updatedConcept);
        this.refreshConceptDetailModal();
      },
      openEditAbilityModal(ability) {
        this.selectedAbility = ability;
        this.showEditAbilityModal = true;
      },
      closeEditAbilityModal() {
        this.selectedAbility = null;
        this.showEditAbilityModal = false;
      },
      async updateEditedAbility(editedAbility) {
        await AbilityService.updateAbility(editedAbility);
        this.refreshConceptDetailModal();
      },
      openDeleteConfirmationModalForAbility(ability) {
        this.selectedAbility = ability;
        this.isDeletingAbility = true; // Indicate we're deleting an ability
        this.showDeleteConfirmationModal = true;
      },
      openDeleteConfirmationModalForMestiere() {
        this.isDeletingAbility = false; // Indicate we're deleting a mestiere
        this.showDeleteConfirmationModal = true;
      },
      closeDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = false;
      },
  
      // DELETING MESTIERI AND ABILITIES
      async confirmDelete() {
        if (this.isDeletingAbility && this.selectedAbility) {
          await AbilityService.deleteAbility(this.selectedAbility);
          this.closeDeleteConfirmationModal();
          this.closeEditAbilityModal();
          this.selectedAbility = null;
        } else if (!this.isDeletingAbility && this.selectedMestiere) {
          await MestieriService.deleteMestiere(this.selectedMestiere);
          this.closeAllModalsAndDeselectMestiere();
          this.deselectMestiere();
        }
        
        this.mestieriStore.fetchMestieri();
      },
    },
    mounted() {
      this.mestieriStore.fetchMestieri();
    },
  };
  </script>
  
  <style scoped>
  .mestiere-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    flex-grow: 1;
    position: relative; /* Ensure proper layering of the modal */
  }
  
  .selection-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 50px;
    filter: blur(0); /* Default state */
    transition: filter 0.3s ease; /* Smooth transition for blur effect */
  }
  
  .selection-cards-container.blurred {
    filter: blur(5px); /* Blur effect when modal is open */
  }
  </style>