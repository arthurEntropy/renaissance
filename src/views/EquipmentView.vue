<template>
    <div class="equipment-selection">
      <h2>EQUIPMENT</h2>
      <button class="button button-primary create-new-button" @click="createEquipment">New Equipment</button>
      
      <!-- Search and Filter Controls -->
      <div class="filter-controls">
        <input
          type="text"
          v-model="searchQuery"
          class="search-input"
          placeholder="Search equipment..."
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
          <optgroup label="Weight">
            <option value="weight-asc">Weight (Light to Heavy)</option>
            <option value="weight-desc">Weight (Heavy to Light)</option>
          </optgroup>
        </select>
      </div>
  
      <div class="selection-cards-container">
        <EquipmentCard 
          v-for="equipment in filteredEquipment" 
          :key="equipment.id" 
          :equipment="equipment" 
          @delete="openDeleteConfirmationModal(equipment)"
          @update="updateEquipment(equipment)"
          @edit="openEditEquipmentModal(equipment)"
          @send-to-chat="sendEquipmentToChat(equipment)"
        />
      </div>
  
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="equipmentToDelete.name" 
        @close="closeDeleteConfirmationModal" 
        @confirm="deleteEquipment"
      />
  
      <EditEquipmentModal 
        v-if="showEditEquipmentModal"
        :equipment="equipmentToEdit"
        @update="saveEditedEquipment"
        @close="closeEditEquipmentModal"
        @delete="openDeleteConfirmationModal(equipmentToEdit)"
      />
    </div>
</template>
  
<script>
import { useEquipmentStore } from '@/stores/equipmentStore';
import EquipmentService from '@/services/EquipmentService';
import EquipmentCard from '@/components/EquipmentCard.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue';

export default {
  components: {
    EquipmentCard,
    DeleteConfirmationModal,
    EditEquipmentModal,
  },

  data() {
    return {
      showEditEquipmentModal: false,
      equipmentToEdit: null,
      showDeleteConfirmationModal: false,
      equipmentToDelete: null,
      searchQuery: '',
      sourceFilter: '',
      sortOption: '',
    };
  },

  computed: {
    store() {
      return useEquipmentStore(); // Access the store via a computed property
    },

    equipment() {
      return this.store.equipment;
    },

    sources() {
      return this.store.sources;
    },

    filteredEquipment() {
      const query = this.searchQuery.toLowerCase().trim();
      let filtered = this.equipment.filter(equipment => !equipment.isDeleted);

      if (this.sourceFilter) {
        filtered = filtered.filter(equipment => equipment.source === this.sourceFilter);
      }

      if (query) {
        filtered = filtered.filter(equipment =>
          equipment.name.toLowerCase().includes(query) ||
          equipment.description.toLowerCase().includes(query)
        );
      }

      if (this.sortOption) {
        const [field, direction] = this.sortOption.split('-');
        filtered.sort((a, b) => {
          if (!a[field] && !b[field]) return 0;
          if (!a[field]) return 1;
          if (!b[field]) return -1;

          const comparison = field === 'name'
            ? a[field].localeCompare(b[field])
            : a[field] - b[field];

          return direction === 'asc' ? comparison : -comparison;
        });
      }

      return filtered;
    },
  },

  methods: {
    async saveEditedEquipment(editedEquipment) {
      await EquipmentService.updateEquipment(editedEquipment);
      this.store.updateEquipmentInStore(editedEquipment); // Use the store from computed
      this.closeEditEquipmentModal();
    },

    async createEquipment() {
      await EquipmentService.createEquipment();
      await this.store.fetchAllEquipment();
    },

    async updateEquipment(equipment) {
      await EquipmentService.updateEquipment(equipment);
      await this.store.fetchAllEquipment();
    },

    async deleteEquipment() {
      this.equipmentToDelete.isDeleted = true;
      await EquipmentService.updateEquipment(this.equipmentToDelete);
      this.closeDeleteConfirmationModal();
      await this.store.fetchAllEquipment();
    },

    openEditEquipmentModal(equipment) {
      this.equipmentToEdit = equipment;
      this.showEditEquipmentModal = true;
    },

    closeEditEquipmentModal() {
      this.equipmentToEdit = null;
      this.showEditEquipmentModal = false;
    },

    sendEquipmentToChat() {
      // TODO
    },

    openDeleteConfirmationModal(equipment) {
      this.equipmentToDelete = equipment;
      this.showDeleteConfirmationModal = true;
    },

    closeDeleteConfirmationModal() {
      this.equipmentToDelete = null;
      this.showDeleteConfirmationModal = false;
    },
  },

  async mounted() {
    await this.store.init(); // Initialize the store
  },
};
</script>
  
<style scoped>
  .equipment-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    flex-grow: 1;
    padding: 0 2rem;
  }
  
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
  
  .source-filter,
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
  
  .source-filter optgroup,
  .sort-filter optgroup {
    background-color: black;
  }
  
  .source-filter option,
  .sort-filter option {
    background-color: rgba(0, 0, 0, 0.85);
    padding: 8px;
  }
  
  .search-input::placeholder {
    color: #888;
  }
  
  .search-input:focus,
  .source-filter:focus,
  .sort-filter:focus {
    outline: none;
    border-color: #888;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
  }
  
  .selection-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-rows: 10px;
    width: 90%;
    max-width: 1400px;
    gap: 0.1rem;
    align-items: start;
    padding: 0.5rem;
  }

  .selection-cards-container > * {
    grid-row: span var(--card-span, 28);
    width: 100%;
    max-width: 300px;
  }
  
  .create-new-button {
    margin-bottom: 1rem;
  }
</style>