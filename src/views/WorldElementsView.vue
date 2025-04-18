<template>
    <div class="world-element-selection">
      <h2>WORLD ELEMENTS</h2>
      <button class="button button-primary create-new-button" @click="createNewWorldElement">New World Element</button>
      <div class="selection-cards-container">
        <SelectionCard 
          v-for="worldElement in worldElements" 
          :key="worldElement.id" 
          :item="worldElement" 
          @select="selectWorldElement(worldElement)"
        />
      </div>
      
      <!-- Concept Detail Modal -->
      <ConceptDetail 
        v-if="selectedWorldElement" 
        :concept="selectedWorldElement" 
        @close="deselectWorldElement" 
        @edit="openEditConceptModal"
        @edit-ability="openEditAbilityModal"
        @delete-ability="openDeleteConfirmationModalForAbility"
      />
  
      <!-- Edit Concept Modal -->
      <EditConceptModal 
        v-if="showEditConceptModal"
        :concept="selectedWorldElement"
        @update="updateEditedConcept"
        @close="closeEditConceptModal"
        @delete="openDeleteConfirmationModalForWorldElement"
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
        :name="isDeletingAbility ? selectedAbility.name : selectedWorldElement.name"
        @close="closeDeleteConfirmationModal" 
        @confirm="confirmDelete"
      />
    </div>
  </template>
  
  <script>
  import { useWorldElementsStore } from '@/stores/worldElementsStore';
  import { mapState } from 'pinia';
  import WorldElementsService from '@/services/WorldElementsService';
  import AbilityService from '@/services/AbilityService';
  import SelectionCard from '@/components/SelectionCard.vue';
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
        worldElementsStore: useWorldElementsStore(),
        selectedWorldElement: null,
        selectedAbility: null, // Track the ability being edited or deleted
        showEditConceptModal: false,
        showEditAbilityModal: false,
        showDeleteConfirmationModal: false,
        isDeletingAbility: false, // Track whether we're deleting an ability
      };
    },
    computed: {
      ...mapState(useWorldElementsStore, ['worldElements']),
      worldElements() {
        return this.worldElementsStore.worldElements;
      },
    },
    methods: {
      // WORLD ELEMENT SELECTION & CRUD
      selectWorldElement(worldElement) {
        this.selectedWorldElement = worldElement;
      },
      deselectWorldElement() {
        this.selectedWorldElement = null;
        this.worldElementsStore.selectedWorldElement = null;
        this.worldElementsStore.fetchWorldElements();
      },
      async createNewWorldElement() {
        const createdWorldElement = await WorldElementsService.createWorldElement();
        await this.worldElementsStore.fetchWorldElements();
        const newWorldElement = this.worldElementsStore.worldElements.find(
          (worldElement) => worldElement.id === createdWorldElement.id
        );
        this.selectWorldElement(newWorldElement);
      },
      updateWorldElement(updatedWorldElement) {
        WorldElementsService.saveWorldElement(updatedWorldElement);
        this.worldElementsStore.fetchWorldElements();
        this.selectedWorldElement = updatedWorldElement;
      },
  
      // MODAL CONTROLS
      closeAllModalsAndDeselectWorldElement() {
        this.showEditConceptModal = false;
        this.showEditAbilityModal = false;
        this.showDeleteConfirmationModal = false;
        this.deselectWorldElement();
      },
      refreshConceptDetailModal() {
        var selectedWorldElement = this.selectedWorldElement;
        this.selectedWorldElement = null;
        // TODO: better solution for this issue
        setTimeout(() => {
          this.selectedWorldElement = selectedWorldElement;
        }, 1);
      },
      openEditConceptModal() {
        this.showEditConceptModal = true;
      },
      closeEditConceptModal() {
        this.showEditConceptModal = false;
      },
      updateEditedConcept(updatedConcept) {
        this.updateWorldElement(updatedConcept);
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
      openDeleteConfirmationModalForWorldElement() {
        this.isDeletingAbility = false; // Indicate we're deleting a world element
        this.showDeleteConfirmationModal = true;
      },
      closeDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = false;
      },
  
      // DELETING WORLD ELEMENTS AND ABILITIES
      async confirmDelete() {
        if (this.isDeletingAbility && this.selectedAbility) {
          await AbilityService.deleteAbility(this.selectedAbility);
          this.closeDeleteConfirmationModal();
          this.closeEditAbilityModal();
          this.selectedAbility = null;
        } else if (!this.isDeletingAbility && this.selectedWorldElement) {
          await WorldElementsService.deleteWorldElement(this.selectedWorldElement);
          this.closeAllModalsAndDeselectWorldElement();
          this.deselectWorldElement();
        }
        
        this.worldElementsStore.fetchWorldElements();
      },
    },
    mounted() {
      this.worldElementsStore.fetchWorldElements();
    },
  };
  </script>
  
  <style scoped>
  .world-element-selection {
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