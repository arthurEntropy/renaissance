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
    @edit="openEditConceptModal"
    @edit-ability="openEditAbilityModal"
    @delete-ability="openDeleteConfirmationModalForAbility" 
    @edit-equipment="openEditEquipmentModal"
  />

  <EditConceptModal 
    v-if="showEditConceptModal"
    :concept="selectedCulture"
    @update="updateEditedConcept"
    @close="closeEditConceptModal"
    @delete="openDeleteConfirmationModalForCulture"
  />

  <EditAbilityModal 
    v-if="showEditAbilityModal"
    :ability="selectedAbility"
    @update="updateEditedAbility"
    @close="closeEditAbilityModal"
    @delete="openDeleteConfirmationModalForAbility"
  />

  <EditEquipmentModal 
    v-if="showEditEquipmentModal"
    :equipment="selectedEquipment"
    @update="updateEditedEquipment"
    @close="closeEditEquipmentModal"
    @delete="openDeleteConfirmationModalForEquipment"
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
import EquipmentService from '@/services/EquipmentService';
import SelectionCard from '@/components/SelectionCard.vue';
import ConceptDetail from '@/components/modals/ConceptDetailModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import EditConceptModal from '@/components/modals/EditConceptModal.vue';
import EditAbilityModal from '@/components/modals/EditAbilityModal.vue';
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue';
import AbilityService from '@/services/AbilityService';

export default {
  components: {
    SelectionCard,
    ConceptDetail,
    DeleteConfirmationModal,
    EditConceptModal,
    EditAbilityModal,
    EditEquipmentModal,
  },
  data() {
    return {
      culturesStore: useCulturesStore(),
      selectedCulture: null,
      selectedEquipment: null, // Track the selected equipment
      showDeleteConfirmationModal: false,
      showEditConceptModal: false,
      showEditAbilityModal: false,
      showEditEquipmentModal: false, // Track the visibility of the EditEquipmentModal
      selectedAbility: null,
      isDeletingAbility: false,
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
      CultureService.updateCulture(updatedCulture);
      this.culturesStore.fetchCultures();
      this.selectedCulture = updatedCulture;
    },
    deleteCulture() {
      this.selectedCulture.isDeleted = true;
      CultureService.updateCulture(this.selectedCulture);
      this.closeDeleteConfirmationModal();
      this.deselectCulture();
    },

    // EQUIPMENT MODAL CONTROLS
    openEditEquipmentModal(equipment) {
      this.selectedEquipment = equipment;
      this.showEditEquipmentModal = true;
    },
    closeEditEquipmentModal() {
      this.selectedEquipment = null;
      this.showEditEquipmentModal = false;
    },
    async updateEditedEquipment(updatedEquipment) {
      await EquipmentService.updateEquipment(updatedEquipment);
      this.closeEditEquipmentModal();
      this.culturesStore.fetchCultures(); // Refresh cultures to reflect changes
    },
    openDeleteConfirmationModalForEquipment() {
      this.showDeleteConfirmationModal = true;
    },

    // MODAL CONTROLS
    openEditConceptModal() {
      this.showEditConceptModal = true;
    },
    closeEditConceptModal() {
      this.showEditConceptModal = false;
    },
    refreshConceptDetailModal() {
      var selectedCulture = this.selectedCulture;
      this.selectedCulture = null;
      // TODO: better solution for this issue
      setTimeout(() => {
        this.selectedCulture = selectedCulture;
      }, 1);
    },
    updateEditedConcept(updatedConcept) {
      this.updateCulture(updatedConcept);
      this.refreshConceptDetailModal();
    },
    openEditAbilityModal(ability) {
      this.selectedAbility = ability;
      this.showEditAbilityModal = true;
    },
    closeEditAbilityModal() {
      this.showEditAbilityModal = false;
    },
    updateEditedAbility(updatedAbility) {
      AbilityService.updateAbility(updatedAbility);
      this.culturesStore.fetchCultures();
    },
    openDeleteConfirmationModalForAbility() {
      this.showDeleteConfirmationModal = true;
    },
    openDeleteConfirmationModalForCulture() {
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