<template>
  <ItemCardsView itemType="Equipment" itemTypePlural="Equipment" :sources="sources" :items="equipment"
    :sortOptions="sortOptions" v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter"
    v-model:sortOption="sortOption" @create="createEquipment" ref="itemCardsView">

    <!-- Item cards slot -->
    <template #item-cards="{ filteredItems }">
      <EquipmentCard v-for="item in filteredItems" :key="item.id" :equipment="item" :editable="true" :sources="sources"
        @edit="openEditEquipmentModal(item)" @send-to-chat="sendEquipmentToChat(item)"
        @height-changed="onCardHeightChanged" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="equipment"
        :standards-of-living="equipmentStore.standardsOfLiving" :sources="sources" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" />
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
        'Type': [
          { value: 'isMelee-desc', label: 'Weapons First' },
          { value: 'isMelee-asc', label: 'Gear First' },
        ],
      },
    }
  },

  computed: {
    ...mapState(useEquipmentStore, ['equipment']),
  },

  methods: {
    // Handle card height changes to update masonry layout
    onCardHeightChanged() {
      this.$nextTick(() => {
        // Attempt to find the MasonryGrid component and update it
        const masonryGrid = this.$el.querySelector('.masonry-grid')?.__vue__
        if (masonryGrid && typeof masonryGrid.updateLayout === 'function') {
          masonryGrid.updateLayout()
        }
      })
    },

    // EQUIPMENT CRUD
    async createEquipment() {
      const newEquipment = await EquipmentService.createEquipment()
      await this.equipmentStore.fetchAllEquipment()
      this.equipmentToEdit = this.equipmentStore.equipment.find(
        (item) => item.id === newEquipment.id,
      )
      this.showEditEquipmentModal = true
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
    try {
      // Fetch sources first to ensure background images are available as soon as possible
      await this.fetchSources()
      // Then fetch equipment and standards of living
      await Promise.all([
        this.equipmentStore.fetchAllEquipment(),
        this.equipmentStore.fetchStandardsOfLiving()
      ]);
    } catch (error) {
      console.error('Error initializing EquipmentView:', error)
    }
  },
}
</script>
