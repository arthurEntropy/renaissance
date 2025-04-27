<template>
  <div class="ancestry-selection">
    <h2>ANCESTRIES</h2>
    <button class="button button-primary create-new-button" @click="createNewAncestry">New Ancestry</button>
    <div class="selection-cards-container">
      <SelectionCard 
        v-for="ancestry in ancestries" 
        :key="ancestry.id" 
        :item="ancestry" 
        @select="selectAncestry(ancestry)"
      />
    </div>
    
    <!-- Concept Detail Modal -->
    <ConceptDetail 
      v-if="selectedAncestry" 
      :concept="selectedAncestry" 
      @close="deselectAncestry" 
      @edit="openEditConceptModal"
      @edit-ability="openEditAbilityModal"
      @delete-ability="openDeleteConfirmationModalForAbility"
    />

    <!-- Edit Concept Modal -->
    <EditConceptModal 
      v-if="showEditConceptModal"
      :concept="selectedAncestry"
      @update="updateEditedConcept"
      @close="closeEditConceptModal"
      @delete="openDeleteConfirmationModalForAncestry"
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
      :name="isDeletingAbility ? selectedAbility.name : selectedAncestry.name"
      @close="closeDeleteConfirmationModal" 
      @confirm="confirmDelete"
    />
  </div>
</template>

<script>
import { useAncestriesStore } from '@/stores/ancestriesStore';
import { mapState } from 'pinia';
import AncestryService from '@/services/AncestryService';
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
      ancestriesStore: useAncestriesStore(),
      selectedAncestry: null,
      selectedAbility: null, // Track the ability being edited or deleted
      showEditConceptModal: false,
      showEditAbilityModal: false,
      showDeleteConfirmationModal: false,
      isDeletingAbility: false, // Track whether we're deleting an ability
    };
  },
  computed: {
    ...mapState(useAncestriesStore, ['ancestries']),
    ancestries() {
      return this.ancestriesStore.ancestries;
    },
  },
  methods: {
    // ANCESTRY SELECTION & CRUD
    selectAncestry(ancestry) {
      this.selectedAncestry = ancestry;
    },
    deselectAncestry() {
      this.selectedAncestry = null;
      this.ancestriesStore.selectedAncestry = null;
      this.ancestriesStore.fetchAncestries();
    },
    async createNewAncestry() {
      const createdAncestry = await AncestryService.createAncestry();
      await this.ancestriesStore.fetchAncestries();
      const newAncestry = this.ancestriesStore.ancestries.find(
        (ancestry) => ancestry.id === createdAncestry.id
      );
      this.selectAncestry(newAncestry);
    },
    updateAncestry(updatedAncestry) {
      AncestryService.saveAncestry(updatedAncestry);
      this.ancestriesStore.fetchAncestries();
      this.selectedAncestry = updatedAncestry;
    },

    // MODAL CONTROLS
    closeAllModalsAndDeselectAncestry() {
      this.showEditConceptModal = false;
      this.showEditAbilityModal = false;
      this.showDeleteConfirmationModal = false;
      this.deselectAncestry();
    },
    refreshConceptDetailModal() {
      var selectedAncestry = this.selectedAncestry;
      this.selectedAncestry = null;
      // TODO: better solution for this issue
      setTimeout(() => {
        this.selectedAncestry = selectedAncestry;
      }, 1);
    },
    openEditConceptModal() {
      this.showEditConceptModal = true;
    },
    closeEditConceptModal() {
      this.showEditConceptModal = false;
    },
    updateEditedConcept(updatedConcept) {
      this.updateAncestry(updatedConcept);
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
    openDeleteConfirmationModalForAncestry() {
      this.isDeletingAbility = false; // Indicate we're deleting an ancestry
      this.showDeleteConfirmationModal = true;
    },
    closeDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = false;
    },

    // DELETING ANCESTRIES AND ABILITIES
    async confirmDelete() {
      if (this.isDeletingAbility && this.selectedAbility) {
        await AbilityService.deleteAbility(this.selectedAbility);
        this.closeDeleteConfirmationModal();
        this.closeEditAbilityModal();
        this.selectedAbility = null;
      } else if (!this.isDeletingAbility && this.selectedAncestry) {
        await AncestryService.deleteAncestry(this.selectedAncestry);
        this.closeAllModalsAndDeselectAncestry();
        this.deselectAncestry();
      }
      
      this.ancestriesStore.fetchAncestries();
    },
  },
  mounted() {
    this.ancestriesStore.fetchAncestries();
  },
};
</script>

<style scoped>
.ancestry-selection {
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