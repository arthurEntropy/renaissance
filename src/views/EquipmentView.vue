<template>
  <ItemCardsView itemType="Equipment" itemTypePlural="Equipment" :sources="sources" v-model:searchQuery="searchQuery"
    v-model:sourceFilter="sourceFilter" @create="createEquipment">

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
      <EquipmentCard v-for="equipment in filteredEquipment" :key="equipment.id" :equipment="equipment" :editable="true"
        @delete="deleteEquipment(equipment)" @update="updateEquipment(equipment)"
        @edit="openEditEquipmentModal(equipment)" @send-to-chat="sendEquipmentToChat(equipment)" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditEquipmentModal v-if="showEditEquipmentModal" :equipmentId="equipmentToEdit?.id" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
    </template>
  </ItemCardsView>
</template>

<script>
import { useEquipmentStore } from '@/stores/equipmentStore'
import { mapState } from 'pinia'
import EquipmentService from '@/services/EquipmentService'
import EquipmentCard from '@/components/EquipmentCard.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'
import ItemCardsView from '@/components/ItemCardsView.vue'

export default {
  components: {
    EquipmentCard,
    EditEquipmentModal,
    ItemCardsView,
  },

  data() {
    return {
      equipmentStore: useEquipmentStore(),
      showEditEquipmentModal: false,
      equipmentToEdit: null,
      sortOption: '',
      searchQuery: '',
      sourceFilter: '',
      sources: {
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      },
    }
  },

  computed: {
    ...mapState(useEquipmentStore, ['equipment']),

    filteredEquipment() {
      const query = this.searchQuery.toLowerCase().trim()
      const sourceFilter = this.sourceFilter

      // Filter out deleted equipment
      let filtered = this.equipment.filter((equipment) => !equipment.isDeleted)

      // Apply source filter
      if (sourceFilter) {
        filtered = filtered.filter(
          (equipment) => equipment.source === sourceFilter,
        )
      }

      // Apply search query
      if (query) {
        filtered = filtered.filter(
          (equipment) =>
            equipment.name.toLowerCase().includes(query) ||
            equipment.description.toLowerCase().includes(query),
        )
      }

      // Apply sorting
      if (this.sortOption) {
        const [field, direction] = this.sortOption.split('-')
        filtered.sort((a, b) => {
          // Handle null or undefined values
          if (!a[field] && !b[field]) return 0
          if (!a[field]) return 1
          if (!b[field]) return -1

          const comparison =
            field === 'name'
              ? a[field].localeCompare(b[field])
              : a[field] - b[field]

          return direction === 'asc' ? comparison : -comparison
        })
      }

      return filtered
    },
  },

  methods: {
    // EQUIPMENT CRUD
    async createEquipment() {
      const newEquipment = await EquipmentService.createEquipment()
      await this.equipmentStore.fetchAllEquipment()
      this.equipmentToEdit = this.equipment.find(
        (equipment) => equipment.id === newEquipment.id,
      )
      this.showEditEquipmentModal = true
    },

    async updateEquipment(equipment) {
      await EquipmentService.updateEquipment(equipment)
      await this.equipmentStore.fetchAllEquipment()
    },

    async deleteEquipment(equipment) {
      const deleteId = equipment?.id
      const editId = this.equipmentToEdit?.id
      if (equipment) {
        const equipmentToUpdate = { ...equipment, isDeleted: true }
        try {
          if (this.showEditEquipmentModal && editId === deleteId) {
            this.closeEditEquipmentModal()
          }
          await EquipmentService.updateEquipment(equipmentToUpdate)
          await this.equipmentStore.fetchAllEquipment()
        } catch (error) {
          console.error('Error deleting equipment:', error)
        }
      }
    },

    async saveEditedEquipment(editedEquipment) {
      await EquipmentService.updateEquipment(editedEquipment)
      this.closeEditEquipmentModal()
      await this.equipmentStore.fetchAllEquipment()
    },

    // MODAL CONTROLS
    openEditEquipmentModal(equipment) {
      this.equipmentToEdit = equipment
      this.showEditEquipmentModal = true
    },

    closeEditEquipmentModal() {
      this.equipmentToEdit = null
      this.showEditEquipmentModal = false
    },

    // OTHER METHODS
    sendEquipmentToChat(equipment) {
      // TODO: Implement sending equipment to chat
      console.log('Send to chat not yet implemented:', equipment)
    },

    async fetchSources() {
      await this.equipmentStore.fetchAllSources()
      this.sources = this.equipmentStore.sources
    },
  },

  async mounted() {
    await this.equipmentStore.fetchAllEquipment()
    await this.equipmentStore.fetchStandardsOfLiving()
    await this.fetchSources()
  },
}
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
}

.sort-filter optgroup {
  background-color: black;
}

.sort-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}
</style>
