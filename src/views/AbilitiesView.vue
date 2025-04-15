<template>
    <div class="ability-selection">
      <h2>ABILITIES</h2>
      <button class="button button-primary create-new-button" @click="createAbility">New Ability</button>
      <div class="selection-cards-container">
        <AbilityCard 
          v-for="ability in abilities" 
          :key="ability.id" 
          :ability="ability" 
          @delete="openDeleteConfirmationModal(ability)"
          @update="updateAbility(ability)"
          @edit="openEditAbilityModal(ability)"
          @send-to-chat="sendAbilityToChat(ability)"
        />
      </div>
  
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="abilityToDelete.name" 
        @close="closeDeleteConfirmationModal" 
        @confirm="deleteAbility"
      />
  
      <EditAbilityModal 
        v-if="showEditAbilityModal"
        :ability="abilityToEdit"
        @save="saveEditedAbility"
        @cancel="closeEditAbilityModal"
        @delete="openDeleteConfirmationModal(abilityToEdit)"
      />
    </div>
  </template>
  
  <script>
  import { useAbilitiesStore } from '@/stores/abilitiesStore';
  import { mapState } from 'pinia';
  import AbilityService from '@/services/AbilityService';
  import AbilityCard from '@/components/AbilityCard.vue';
  import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
  import EditAbilityModal from '@/components/modals/EditAbilityModal.vue';
  
  export default {
    components: {
      AbilityCard,
      DeleteConfirmationModal,
      EditAbilityModal,
    },
    data() {
      return {
        abilitiesStore: useAbilitiesStore(),
        showEditAbilityModal: false,
        abilityToEdit: null,
        showDeleteConfirmationModal: false,
        abilityToDelete: null,
      };
    },
    computed: {
      ...mapState(useAbilitiesStore, ['abilities']),
      abilities() {
        return this.abilitiesStore.abilities.filter(ability => !ability.isDeleted);
      },
    },
    methods: {
      // ABILITY CRUD
      async createAbility() {
        await AbilityService.createAbility();
        await this.abilitiesStore.fetchAllAbilities();
      },
      async updateAbility(ability) {
        await AbilityService.updateAbility(ability);
        await this.abilitiesStore.fetchAllAbilities();
      },
      async deleteAbility() {
        this.abilityToDelete.isDeleted = true;
        AbilityService.updateAbility(this.abilityToDelete);
        this.closeDeleteConfirmationModal();
        this.abilitiesStore.fetchAllAbilities();
      },
  
      // MODAL CONTROLS
      openEditAbilityModal(ability) {
        this.abilityToEdit = ability;
        this.showEditAbilityModal = true;
      },
      closeEditAbilityModal() {
        this.abilityToEdit = null;
        this.showEditAbilityModal = false;
      },
      async saveEditedAbility(editedAbility) {
        await AbilityService.updateAbility(editedAbility);
        this.closeEditAbilityModal();
        this.abilitiesStore.fetchAllAbilities();
      },
      sendAbilityToChat() {
        // TODO
      },
      openDeleteConfirmationModal(ability) {
        this.abilityToDelete = ability;
        this.showDeleteConfirmationModal = true;
      },
      closeDeleteConfirmationModal() {
        this.abilityToDelete = null;
        this.showDeleteConfirmationModal = false;
      },
    },
    mounted() {
      this.abilitiesStore.fetchAllAbilities();
    },
  };
  </script>
  
  <style scoped>
  .ability-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    flex-grow: 1;
  }
  
  .selection-cards-container {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 50px;
  }
  
  .create-new-button {
    margin-bottom: 1rem;
  }
  </style>