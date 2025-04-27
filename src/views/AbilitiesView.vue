<template>
  
  <ItemListView
    itemType="Ability"
    itemTypePlural="Abilities"
    :sources="sources"
    v-model:searchQuery="searchQuery"
    v-model:sourceFilter="sourceFilter"
    @create="createAbility"
    @update-layout="updateLayout"
  >
    <!-- Additional filters slot -->
    <template #additional-filters>
      <select v-model="sortOption" class="sort-filter">
        <option value="">Sort by...</option>
        <optgroup label="Name">
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </optgroup>
        <optgroup label="MP">
          <option value="mp-asc">MP (Low to High)</option>
          <option value="mp-desc">MP (High to Low)</option>
        </optgroup>
        <optgroup label="XP">
          <option value="xp-asc">XP (Low to High)</option>
          <option value="xp-desc">XP (High to Low)</option>
        </optgroup>
      </select>
    </template>
    
    <!-- Item cards slot -->
    <template #item-cards>
      <AbilityCard 
        v-for="ability in filteredAbilities" 
        :key="ability.id" 
        :ability="ability" 
        @delete="openDeleteConfirmationModal(ability)"
        @update="updateAbility(ability)"
        @edit="openEditAbilityModal(ability)"
        @send-to-chat="sendAbilityToChat(ability)"
        @height-changed="updateLayout"
      />
    </template>
    
    <!-- Modals slot -->
    <template #modals>
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="abilityToDelete?.name" 
        @close="closeDeleteConfirmationModal" 
        @confirm="deleteAbility"
      />
      
      <EditAbilityModal 
        v-if="showEditAbilityModal"
        :ability="abilityToEdit"
        @update="saveEditedAbility"
        @close="closeEditAbilityModal"
        @delete="openDeleteConfirmationModal(abilityToEdit)"
      />
    </template>
  </ItemListView>
</template>

<script>
import { useAbilitiesStore } from '@/stores/abilitiesStore';
import { mapState } from 'pinia';
import AbilityService from '@/services/AbilityService';
import AbilityCard from '@/components/AbilityCard.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import EditAbilityModal from '@/components/modals/EditAbilityModal.vue';
import ItemListView from '@/components/ItemsView.vue';

export default {
  components: {
    AbilityCard,
    DeleteConfirmationModal,
    EditAbilityModal,
    ItemListView,
  },
  data() {
    return {
      abilitiesStore: useAbilitiesStore(),
      showEditAbilityModal: false,
      abilityToEdit: null,
      showDeleteConfirmationModal: false,
      abilityToDelete: null,
      sortOption: '',
      searchQuery: '',
      sourceFilter: '',
      sources: {
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      },
    };
  },
  computed: {
    ...mapState(useAbilitiesStore, ['abilities']),
    filteredAbilities() {
      // Use local data properties instead of accessing through $children
      const query = this.searchQuery.toLowerCase().trim();
      const sourceFilter = this.sourceFilter;
      
      let filtered = this.abilitiesStore.abilities.filter(ability => !ability.isDeleted);
      
      // Apply source filter
      if (sourceFilter) {
        filtered = filtered.filter(ability => ability.source === sourceFilter);
      }
      
      // Apply search query
      if (query) {
        filtered = filtered.filter(ability => 
          ability.name.toLowerCase().includes(query) ||
          ability.description.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (this.sortOption) {
        const [field, direction] = this.sortOption.split('-');
        filtered.sort((a, b) => {
          let comparison = 0;
          
          // Handle null/undefined values
          if (!a[field] && !b[field]) return 0;
          if (!a[field]) return 1;
          if (!b[field]) return -1;

          // Compare based on field type
          if (field === 'name') {
            comparison = a[field].localeCompare(b[field]);
          } else {
            comparison = a[field] - b[field];
          }
          
          return direction === 'asc' ? comparison : -comparison;
        });
      }
      
      return filtered;
    }
  },
  methods: {
    updateLayout() {
      // This will be called when any card height changes
    },

    // ABILITY CRUD
    async createAbility() {
      const newAbility = await AbilityService.createAbility();
      await this.abilitiesStore.fetchAllAbilities();
      this.abilityToEdit = this.abilitiesStore.abilities.find(ability => 
        ability.id === newAbility.id
      );
      this.showEditAbilityModal = true;
    },
    async updateAbility(ability) {
      await AbilityService.updateAbility(ability);
      await this.abilitiesStore.fetchAllAbilities();
    },
    async deleteAbility() {
      // Make a copy of the IDs to ensure we can still access them after closing modals
      const deleteId = this.abilityToDelete?.id;
      const editId = this.abilityToEdit?.id;
      
      if (this.abilityToDelete) {
        // Create a new object to ensure we're not modifying a potentially frozen object
        const abilityToUpdate = { ...this.abilityToDelete, isDeleted: true };
        
        try {
          // Close the delete confirmation modal first
          this.closeDeleteConfirmationModal();
          
          // Check if we need to close the edit modal (if it's open for the same item)
          if (this.showEditAbilityModal && editId === deleteId) {
            this.closeEditAbilityModal();
          }
          
          // Now update the ability with isDeleted set to true
          await AbilityService.updateAbility(abilityToUpdate);
          
          // Finally refresh the abilities list
          await this.abilitiesStore.fetchAllAbilities();
        } catch (error) {
          console.error('Error deleting ability:', error);
        }
      }
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
      await this.abilitiesStore.fetchAllAbilities();
    },
    sendAbilityToChat(ability) {
      // TODO: Implement sending ability to chat
      console.log('Sending to chat:', ability);
    },
    openDeleteConfirmationModal(ability) {
      this.abilityToDelete = ability;
      this.showDeleteConfirmationModal = true;
    },
    closeDeleteConfirmationModal() {
      this.abilityToDelete = null;
      this.showDeleteConfirmationModal = false;
    },
    async fetchSources() {
      await this.abilitiesStore.fetchAllSources();
      this.sources = this.abilitiesStore.sources;
    }
  },
  async mounted() {
    await this.abilitiesStore.fetchAllAbilities();
    await this.fetchSources();
  },
};
</script>

<style scoped>
.sort-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 16px;
  font-family: 'Lora', serif;
}

.sort-filter optgroup {
  background-color: black;
}

.sort-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}
</style>