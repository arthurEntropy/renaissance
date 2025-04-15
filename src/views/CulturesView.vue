<template>
  <div class="culture-selection" v-if="!selectedCulture">
    <h2>CULTURES</h2>
    <button class="button button-primary create-new-button" @click="createNewCulture">New Culture</button>
    <div class="selection-cards-container">
      <SelectionCard 
        v-for="culture in cultures" 
        :key="culture.id" 
        :item="culture" 
        @select="selectCulture(culture)"
      />
    </div>
  </div>
  
  <ConceptDetail 
    v-else 
    :concept="selectedCulture" 
    @close="deselectCulture" 
    @update="updateCulture"
    @delete="openDeleteConfirmationModal"
  />

  <DeleteConfirmationModal 
    v-if="showDeleteConfirmationModal"
    :name="selectedCulture.name" 
    @close="closeDeleteConfirmationModal" 
    @confirm="deleteCulture"
  />
</template>

<script>
  import { useCulturesStore } from '@/stores/culturesStore';
  import { mapState } from 'pinia';
  import CultureService from '@/services/CultureService';
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
        culturesStore: useCulturesStore(),
        selectedCulture: null,
        showDeleteConfirmationModal: false,
      };
    },
    computed: {
      ...mapState(useCulturesStore, ['cultures']),
      cultures() {
        return this.culturesStore.cultures.filter(culture => !culture.isDeleted);
      },
    },
    methods: {
      // CULTURE SELECTION & CRUD
      selectCulture(culture) {
        this.selectedCulture = culture;
      },
      deselectCulture() {
        this.selectedCulture = null;
        this.culturesStore.selectedCulture = null;
        this.culturesStore.fetchCultures();
      },
      async createNewCulture() {
        const createdCulture = await CultureService.createCulture();
        await this.culturesStore.fetchCultures();
        const newCulture = this.culturesStore.cultures.find(
          (culture) => culture.id === createdCulture.id
        );
        this.selectCulture(newCulture);
      },
      updateCulture(updatedCulture) {
        this.selectedCulture = { ...updatedCulture };
      },
      deleteCulture() {
        this.selectedCulture.isDeleted = true;
        CultureService.saveCulture(this.selectedCulture);
        this.closeDeleteConfirmationModal();
        this.deselectCulture();
      },

      // MODAL CONTROLS
      openDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = true;
      },
      closeDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = false;
      },
    },
    mounted() {
      this.culturesStore.fetchCultures();
    },
  };
</script>

<style scoped>
  .culture-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    flex-grow: 1;
    margin: 0 auto;
    padding: 1rem;
  }

  .selection-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 50px;
  }
</style>