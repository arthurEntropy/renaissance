<template>
  <ItemListView
    title="EQUIPMENT"
    itemType="Equipment"
    itemTypePlural="Equipment"
    :sources="sources"
    v-model:searchQuery="searchQuery"
    v-model:sourceFilter="sourceFilter"
    @create="createEquipment"
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
        <optgroup label="Weight">
          <option value="weight-asc">Weight (Light to Heavy)</option>
          <option value="weight-desc">Weight (Heavy to Light)</option>
        </optgroup>
      </select>
    </template>
    
    <!-- Item cards slot -->
    <template #item-cards>
      <EquipmentCard 
        v-for="equipment in filteredEquipment" 
        :key="equipment.id" 
        :equipment="equipment" 
        @delete="openDeleteConfirmationModal(equipment)"
        @update="updateEquipment(equipment)"
        @edit="openEditEquipmentModal(equipment)"
        @send-to-chat="sendEquipmentToChat(equipment)"
        @height-changed="updateLayout"
      />
    </template>
    
    <!-- Modals slot -->
    <template #modals>
      <DeleteConfirmationModal 
        v-if="showDeleteConfirmationModal"
        :name="equipmentToDelete?.name" 
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
    </template>
  </ItemListView>
</template>

<script>
import { useEquipmentStore } from '@/stores/equipmentStore';
import EquipmentService from '@/services/EquipmentService';
import EquipmentCard from '@/components/EquipmentCard.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue';
import ItemListView from '@/components/ItemsView.vue';

export default {
  components: {
    EquipmentCard,
    DeleteConfirmationModal,
    EditEquipmentModal,
    ItemListView,
  },

  data() {
    return {
      showEditEquipmentModal: false,
      equipmentToEdit: null,
      showDeleteConfirmationModal: false,
      equipmentToDelete: null,
      sortOption: '',
      searchQuery: '',
      sourceFilter: '',
    };
  },

  computed: {
    store() {
      return useEquipmentStore();
    },

    equipment() {
      return this.store.equipment;
    },

    sources() {
      return this.store.sources;
    },

    filteredEquipment() {
      // Use local data properties instead of accessing through $children
      const query = this.searchQuery.toLowerCase().trim();
      const sourceFilter = this.sourceFilter;
      
      let filtered = this.equipment.filter(equipment => !equipment.isDeleted);

      if (sourceFilter) {
        filtered = filtered.filter(equipment => equipment.source === sourceFilter);
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
    updateLayout() {
      // Same placeholder method for consistency
    },

    async saveEditedEquipment(editedEquipment) {
      await EquipmentService.updateEquipment(editedEquipment);
      this.store.updateEquipmentInStore(editedEquipment);
      this.closeEditEquipmentModal();
    },

    async createEquipment() {
      const newEquipment = await EquipmentService.createEquipment();
      await this.store.fetchAllEquipment();
      this.equipmentToEdit = this.store.equipment.find(e => e.id === newEquipment.id);
      this.showEditEquipmentModal = true;
    },

    async updateEquipment(equipment) {
      await EquipmentService.updateEquipment(equipment);
      await this.store.fetchAllEquipment();
    },

    async deleteEquipment() {
      // Make a copy of the IDs to ensure we can still access them after closing modals
      const deleteId = this.equipmentToDelete?.id;
      const editId = this.equipmentToEdit?.id;
      
      if (this.equipmentToDelete) {
        // Create a new object to ensure we're not modifying a potentially frozen object
        const equipmentToUpdate = { ...this.equipmentToDelete, isDeleted: true };
        
        try {
          // Close the delete confirmation modal first
          this.closeDeleteConfirmationModal();
          
          // Check if we need to close the edit modal (if it's open for the same item)
          if (this.showEditEquipmentModal && editId === deleteId) {
            this.closeEditEquipmentModal();
          }
          
          // Now update the equipment with isDeleted set to true
          await EquipmentService.updateEquipment(equipmentToUpdate);
          
          // Finally refresh the equipment list
          await this.store.fetchAllEquipment();
        } catch (error) {
          console.error('Error deleting equipment:', error);
        }
      }
    },

    openEditEquipmentModal(equipment) {
      this.equipmentToEdit = equipment;
      this.showEditEquipmentModal = true;
    },

    closeEditEquipmentModal() {
      this.equipmentToEdit = null;
      this.showEditEquipmentModal = false;
    },

    sendEquipmentToChat(equipment) {
      // TODO: Implement sending equipment to chat
      console.log('Sending to chat:', equipment);
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
    await this.store.init();
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