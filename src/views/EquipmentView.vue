<template>
  <ItemCardsView itemType="Equipment" itemTypePlural="Equipment" :sources="sources" :items="equipment"
    :sortOptions="sortOptions" v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter"
    v-model:sortOption="sortOption" @create="createEquipment">

    <template #item-cards="{ filteredItems }">
      <EquipmentCard v-for="equipment in filteredItems" :key="equipment.id" :equipment="equipment" :editable="true"
        @delete="deleteEquipment(equipment)" @update="updateEquipment(equipment)"
        @edit="openEditEquipmentModal(equipment)" @send-to-chat="sendEquipmentToChat(equipment)" />
    </template>

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
      sortOptions: {
        'Name': [
          { value: 'name-asc', label: 'Name (A-Z)' },
          { value: 'name-desc', label: 'Name (Z-A)' },
        ],
        'Weight': [
          { value: 'weight-asc', label: 'Weight (Light to Heavy)' },
          { value: 'weight-desc', label: 'Weight (Heavy to Light)' },
        ],
      },
    }
  },

  computed: {
    ...mapState(useEquipmentStore, ['equipment']),
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
