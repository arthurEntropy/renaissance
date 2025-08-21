<template>
  <ItemCardsLayout itemType="Equipment" itemTypePlural="Equipment" :sources="sources" :items="equipment"
    :sortOptions="sortOptions" v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter"
    v-model:sortOption="sortOption" @create="createEquipment" ref="layoutRef">

    <!-- Item cards slot -->
    <template #item-cards="{ filteredItems }">
      <EquipmentCard v-for="item in filteredItems" :key="item.id" :equipment="item" :editable="true" :sources="sources"
        :art-expanded="true" @edit="openEditEquipmentModal(item)" @send-to-chat="sendEquipmentToChat(item)"
        @height-changed="layoutRef?.onCardHeightChanged()" :collapsible="false" :showSource="true" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="equipment"
        :standards-of-living="equipmentStore.standardsOfLiving" :sources="sources"
        :engagement-success-options="engagementSuccessOptions" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
    </template>
  </ItemCardsLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEditModal } from '@/composables/useEditModal'
import { useSourcesStore } from '@/stores/sourcesStore'
import EquipmentService from '@/services/equipmentService'
import EngagementSuccessService from '@/services/engagementSuccessService'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import EditEquipmentModal from '@/components/modals/EditEquipmentModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

// Store
const equipmentStore = useEquipmentStore()
const { equipment } = storeToRefs(equipmentStore)

// Modal management
const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

// Sources management
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources

// Reactive state
const layoutRef = ref(null)
const sortOption = ref('')
const searchQuery = ref('')
const sourceFilter = ref('')
const engagementSuccessOptions = ref([])

const sortOptions = ref({
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
})

// EQUIPMENT CRUD
const createEquipment = async () => {
  const newEquipment = await EquipmentService.create()
  await equipmentStore.fetchAllEquipment()
  const createdEquipment = equipmentStore.equipment.find(
    (item) => item.id === newEquipment.id,
  )
  openEditEquipmentModal(createdEquipment)
}

const saveEditedEquipment = async (editedEquipment) => {
  await EquipmentService.update(editedEquipment)
  closeEditEquipmentModal()
  await equipmentStore.fetchAllEquipment()
}

const deleteEquipment = async (equipmentItem) => {
  const deleteId = equipmentItem?.id
  const editId = equipmentToEdit.value?.id
  if (equipmentItem) {
    const equipmentToUpdate = { ...equipmentItem, isDeleted: true }
    try {
      if (showEditEquipmentModal.value && editId === deleteId) {
        closeEditEquipmentModal()
      }
      await EquipmentService.update(equipmentToUpdate)
      await equipmentStore.fetchAllEquipment()
    } catch (error) {
      console.error('Error deleting equipment:', error)
    }
  }
}

// OTHER METHODS
const sendEquipmentToChat = (_equipment) => {
  // Placeholder for future chat integration
}

const fetchEngagementSuccessOptions = async () => {
  try {
    engagementSuccessOptions.value = await EngagementSuccessService.getAll()
  } catch (error) {
    console.error('Error fetching engagement success options:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Sources will auto-fetch via useSources composable
    await equipmentStore.fetchStandardsOfLiving()
    await fetchEngagementSuccessOptions()
    await equipmentStore.fetchAllEquipment()
  } catch (error) {
    console.error('Error initializing EquipmentPage:', error)
  }
})
</script>
