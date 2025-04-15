<template>
  <div class="ancestry-selection" v-if="!selectedAncestry">
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
  </div>
  
  <ConceptDetail 
    v-else 
    :concept="selectedAncestry" 
    @close="deselectAncestry" 
    @update="updateAncestry"
    @delete="openDeleteConfirmationModal"
  />

  <DeleteConfirmationModal 
    v-if="showDeleteConfirmationModal"
    :name="selectedAncestry.name" 
    @close="closeDeleteConfirmationModal" 
    @confirm="deleteAncestry"
  />
</template>

<script>
  import { useAncestriesStore } from '@/stores/ancestriesStore';
  import { mapState } from 'pinia';
  import AncestryService from '@/services/AncestryService';
  import SelectionCard from '@/components/SelectionCard.vue';
  import ConceptDetail from '@/components/ConceptDetail.vue';
  import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';

  export default {
    components: {
      SelectionCard,
      ConceptDetail,
      DeleteConfirmationModal,
    },
    data() {
      return {
        ancestriesStore: useAncestriesStore(),
        selectedAncestry: null,
        showDeleteConfirmationModal: false,
      };
    },
    computed: {
      ...mapState(useAncestriesStore, ['ancestries']),
      ancestries() {
        return this.ancestriesStore.ancestries.filter(ancestry => !ancestry.isDeleted);
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
        this.selectedAncestries = { ...updatedAncestry };
      },
      deleteAncestry() {
        this.selectedAncestry.isDeleted = true;
        AncestryService.saveAncestry(this.selectedAncestry);
        this.closeDeleteConfirmationModal();
        this.deselectAncestry();
      },

      // MODAL CONTROLS
      closeDetailView() {
        this.selectedAncestry = null;
      },
      openDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = true;
      },
      closeDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = false;
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
  }

  .selection-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 50px;
  }
</style>