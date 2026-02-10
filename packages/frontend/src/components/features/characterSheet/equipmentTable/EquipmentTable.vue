<template>
  <CharacterSheetSection>
    <TableHeader title="Equipment" :is-edit-mode="internalEditMode" :show-edit-button="canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <EquipmentWeight :equipment-items="characterEquipment" />
      </template>
    </TableHeader>

    <!-- Masonry Grid with Equipment Items -->
    <MasonryGrid :column-width="375" :gap="15" :row-height="10" class="equipment-masonry" ref="masonryGridRef">
      <div v-for="(item, index) in characterEquipment" :key="item.id" class="masonry-item">

        <div class="equipment-card-col">
          <EquipmentCard v-if="item.equipment" :equipment="item.equipment" :collapsed="item.collapsed || false"
            :editable="item.equipment.isCustom" class="equipment-card" @edit="openEditEquipmentModal"
            :collapsible="false" :show-keeping-badge="false" :show-add-to-character="false"
            :engagement-success-options="[]" :deletable="internalEditMode" @delete="removeEquipmentItem(index)" />

          <span v-else class="missing-item">Unknown item</span>

          <!-- Equipment Details (Carried, Wielding, Quantity, Weight Total) -->
          <EquipmentDetails :equipment-item="item" :index="index" :is-edit-mode="canEdit"
            @update-carried="handleCarriedChange" @update-wielding="handleWieldingChange"
            @update-quantity="handleQuantityChange" />

        </div>
      </div>
    </MasonryGrid>

    <!-- Add Item FAB (only in edit mode) -->
    <div v-if="showAddButton" class="add-button-container">
      <FloatingActionButton type="add" size="large" visibility="always" @click="showEquipmentSelector = true" />
    </div>

    <!-- Equipment Selector Modal -->
    <ItemSelector :show="showEquipmentSelector" title="Add Equipment" :grouped-items="groupedEquipment"
      :search-query="equipmentSearchQuery" search-placeholder="Search equipment..."
      no-items-message="No equipment found" :get-source-name="sourcesStore.getSourceName"
      :show-choice-mode="showChoiceMode" :choice-options="addEquipmentOptions" @close="closeEquipmentSelector"
      @select="selectEquipment" @search="equipmentSearchQuery = $event" @choice="handleEquipmentChoice">
      <template #item-display="{ item }">
        {{ item.name }}
        <span class="equipment-weight">({{ item.weight }} lbs)</span>
      </template>
    </ItemSelector>

    <!-- Edit Equipment Modal -->
    <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="allEquipment"
      :keeping-options="keepingStore.keeping" :sources="sourcesStore.sources"
      :equipment-types="equipmentTypesStore.items" :equipment-subtypes="equipmentSubtypesStore.items"
      :equipment-grades="equipmentGradesStore.items" :engagement-success-options="engagementSuccessOptions"
      @update="saveEditedEquipment" @close="closeEditEquipmentModal" @delete="deleteEquipment" />

  </CharacterSheetSection>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EquipmentWeight from './EquipmentWeight.vue'
import EquipmentDetails from './EquipmentDetails.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import { useEditModal } from '@/composables/useEditModal'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import EquipmentService from '@/services/entities/equipment/equipmentService'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import { BookOpenIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit-custom-equipment'])

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentStore = useEquipmentStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const keepingStore = useKeepingStore()
const sourcesStore = useSourcesStore()

const allEquipment = computed(() => equipmentStore.equipment || [])
const engagementSuccessOptions = ref([])

const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

const internalEditMode = ref(false)
const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const masonryGridRef = ref(null)

const canEdit = computed(() => props.isEditMode)
const showAddButton = computed(() => internalEditMode.value)

const showEquipmentSelector = ref(false)
const showChoiceMode = ref(true)

const addEquipmentOptions = [
  {
    key: 'library',
    label: 'Add from Library',
    icon: BookOpenIcon
  },
  {
    key: 'custom',
    label: 'Add Custom Item',
    icon: PlusIcon
  }
]

const { groupedItems: groupedEquipment, searchQuery: equipmentSearchQuery } = useItemSelector(
  allEquipment,
  sourcesStore,
  { searchFields: ['name'] }
)

const characterEquipment = computed(() => {
  if (!selectedCharacter.value?.equipment) return []
  return selectedCharacter.value.equipment.map((entry) => {
    const equipment = allEquipment.value.find((eq) => eq.id === entry.id)
    return {
      ...entry,
      equipment,
      collapsed: entry.collapsed ?? true,
    }
  })
})

const isCreatingCustom = ref(false)

const createAndAddCustomEquipment = async () => {
  if (isCreatingCustom.value) return

  isCreatingCustom.value = true

  try {
    const createdEquipment = await EquipmentService.createCustomEquipment()

    const newItem = {
      id: createdEquipment.id,
      quantity: 1,
      isCarried: true,
      isWielding: false,
    }

    const updated = CharacterService.addItem(selectedCharacter.value, 'equipment', newItem)
    if (updated) Object.assign(selectedCharacter.value, updated)

    await equipmentStore.fetch()

    const fullEquipment = (equipmentStore.equipment || []).find(
      (eq) => eq.id === createdEquipment.id
    )

    if (fullEquipment) {
      emit('edit-custom-equipment', fullEquipment)
    } else {
      emit('edit-custom-equipment', createdEquipment.id)
    }
  } catch (error) {
    console.error('Error adding custom equipment:', error)
  } finally {
    isCreatingCustom.value = false
  }
}

const removeEquipmentItem = (index) => {
  const equipmentItem = characterEquipment.value[index]
  const equipmentName = equipmentItem?.equipment?.name || 'this item'

  if (confirm(`Are you sure you want to remove ${equipmentName}?`)) {
    const updated = CharacterService.removeItem(selectedCharacter.value, 'equipment', index)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
}

const handleCarriedChange = (index, isCarried) => {
  selectedCharacter.value.equipment[index].isCarried = isCarried

  if (!isCarried && selectedCharacter.value.equipment[index].isWielding) {
    selectedCharacter.value.equipment[index].isWielding = false
  }
}

const handleWieldingChange = (index, isWielding) => {
  const currentItem = selectedCharacter.value.equipment[index]
  const equipmentItem = characterEquipment.value[index]

  let canWield = false
  if (currentItem.isCarried && equipmentItem.equipment) {
    const equipmentType = equipmentTypesStore.getById(equipmentItem.equipment.type)
    canWield = equipmentType?.name === 'Weapon'
  }

  selectedCharacter.value.equipment[index].isWielding = isWielding && canWield
}

const handleQuantityChange = (index, quantity) => {
  selectedCharacter.value.equipment[index].quantity = Math.max(1, quantity)
}

const saveEditedEquipment = async (updatedEquipment) => {
  await EquipmentService.update(updatedEquipment)
  await equipmentStore.fetch()
  closeEditEquipmentModal()
}

const deleteEquipment = async (equipment) => {
  await EquipmentService.delete(equipment)
  await equipmentStore.fetch()
  closeEditEquipmentModal()
}

const selectEquipment = (equipment) => {
  const newItem = {
    id: equipment.id,
    quantity: 1,
    isCarried: true,
    isWielding: false,
    collapsed: false,
  }

  const updated = CharacterService.addItem(selectedCharacter.value, 'equipment', newItem)
  if (updated) Object.assign(selectedCharacter.value, updated)
  showEquipmentSelector.value = false
}

const handleEquipmentChoice = (choice) => {
  if (choice === 'library') {
    showChoiceMode.value = false
  } else if (choice === 'custom') {
    showEquipmentSelector.value = false
    showChoiceMode.value = true
    createAndAddCustomEquipment()
  }
}

const closeEquipmentSelector = () => {
  showEquipmentSelector.value = false
  showChoiceMode.value = true
}

onMounted(async () => {
  try {
    await keepingStore.fetch()
    await Promise.all([
      equipmentTypesStore.fetch(),
      equipmentSubtypesStore.fetch(),
      equipmentGradesStore.fetch()
    ])
    engagementSuccessOptions.value = await EngagementSuccessService.getAll()
  } catch (error) {
    console.error('Error initializing EquipmentTable data:', error)
  }
})
</script>

<style scoped>
.missing-item {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.add-button-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}
</style>
