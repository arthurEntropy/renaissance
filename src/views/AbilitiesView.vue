<template>
    <div class="ability-selection">
      <h2>ABILITIES</h2>
      <button class="button button-primary create-new-button" @click="createAbility">New Ability</button>
      
      <!-- Search and Filter Controls -->
      <div class="filter-controls">
        <input
          type="text"
          v-model="searchQuery"
          class="search-input"
          placeholder="Search abilities..."
        />
        <select v-model="sourceFilter" class="source-filter">
          <option value="">All Sources</option>
          <optgroup label="Ancestries">
            <option v-for="ancestry in sources.ancestries" 
              :key="ancestry.id" 
              :value="ancestry.id"
            >
              {{ ancestry.name }}
            </option>
          </optgroup>
          <optgroup label="Cultures">
            <option v-for="culture in sources.cultures" 
              :key="culture.id" 
              :value="culture.id"
            >
              {{ culture.name }}
            </option>
          </optgroup>
          <optgroup label="Mestieri">
            <option v-for="mestiere in sources.mestieri" 
              :key="mestiere.id" 
              :value="mestiere.id"
            >
              {{ mestiere.name }}
            </option>
          </optgroup>
          <optgroup label="World Elements">
            <option v-for="worldElement in sources.worldElements" 
              :key="worldElement.id" 
              :value="worldElement.id"
            >
              {{ worldElement.name }}
            </option>
          </optgroup>
        </select>
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
      </div>

      <masonry-grid :column-width="350" :gap="6" :row-height="10" class="cards-container">
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
      </masonry-grid>
  
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="abilityToDelete.name" 
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
    </div>
  </template>
  
  <script>
  import { useAbilitiesStore } from '@/stores/abilitiesStore';
  import { mapState } from 'pinia';
  import AbilityService from '@/services/AbilityService';
  import AbilityCard from '@/components/AbilityCard.vue';
  import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
  import EditAbilityModal from '@/components/modals/EditAbilityModal.vue';
  import MasonryGrid from '@/components/MasonryGrid.vue';
  
  export default {
    components: {
      AbilityCard,
      DeleteConfirmationModal,
      EditAbilityModal,
      MasonryGrid,
    },
    data() {
      return {
        abilitiesStore: useAbilitiesStore(),
        showEditAbilityModal: false,
        abilityToEdit: null,
        showDeleteConfirmationModal: false,
        abilityToDelete: null,
        searchQuery: '',
        sourceFilter: '',
        sources: {
          ancestries: [],
          cultures: [],
          mestieri: [],
          worldElements: [],
        },
        sortOption: '',
      };
    },
    computed: {
      ...mapState(useAbilitiesStore, ['abilities']),
      filteredAbilities() {
        const query = this.searchQuery.toLowerCase().trim();
        let filtered = this.abilitiesStore.abilities.filter(ability => !ability.isDeleted);
        
        // Apply source filter
        if (this.sourceFilter) {
          filtered = filtered.filter(ability => ability.source === this.sourceFilter);
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
        // The MasonryGrid handles everything internally, but we could trigger manual refresh if needed
      },

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
      async fetchSources() {
        await this.abilitiesStore.fetchAllSources();
        this.sources = this.abilitiesStore.sources;
      }
    },
    mounted() {
      this.abilitiesStore.fetchAllAbilities(),
      this.fetchSources()
    },
  };
</script>
  
<style scoped>
.filter-controls {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 900px;
  margin-bottom: 1rem;
}

.search-input {
  flex: 2;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 16px;
}

.source-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 16px;
  font-family: 'Lora', serif;
}

.source-filter optgroup {
  background-color: black;
}

.source-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus,
.source-filter:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

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

.ability-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex-grow: 1;
  padding: 0 2rem;
}

.cards-container {
  width: 90%;
  margin: 0 auto;
  padding: 0.5rem;
  box-sizing: border-box;
  overflow: visible;  /* Allow cards to be measured properly */
}

.create-new-button {
  margin-bottom: 1rem;
}
</style>