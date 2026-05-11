<template>
  <CharacterSheetSection>
    <TableHeader title="Equipment" :is-edit-mode="internalEditMode" :show-edit-button="canEdit" collapsible
      :is-collapsed="isCollapsed" @toggle-collapse="isCollapsed = !isCollapsed" @toggle-edit="toggleEditMode">
      <template #header-left>
        <FloatingActionButton v-if="internalEditMode" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
          :visibility="FAB_VISIBILITIES.ALWAYS" @click="openEquipmentSelectorFromButton" />
        <ActionButton v-if="internalEditMode && groupingOption === 'custom'" variant="outline" size="small"
          text="+ Group" @click="createEquipmentGroup" />
      </template>
      <template #header-center>
        <div v-if="internalEditMode" v-show="!isCollapsed" class="header-controls">
          <SortingPicker v-model="groupingOption" :options="groupingOptions" label="Group by:"
            placeholder="Ungrouped" />
          <SortingPicker v-model="equipmentSortOption" :options="sortOptions" label="Order by:" placeholder="Custom" />
        </div>
        <FloatingActionButton v-else-if="!isCollapsed && characterEquipment.length > 0" class="expand-collapse-btn"
          :variant="allEquipmentExpanded ? FAB_TYPES.COLLAPSE_ALL : FAB_TYPES.EXPAND_ALL" :size="FAB_SIZES.SMALL"
          :visibility="FAB_VISIBILITIES.ON_HOVER" @click="toggleAllEquipment" />
      </template>
      <template #header-right>
        <div class="header-right-controls">
          <FloatingActionButton :variant="FAB_TYPES.MARTIAL_TRAINING" :size="FAB_SIZES.LARGE"
            :visibility="FAB_VISIBILITIES.ALWAYS" @click="openMartialTraining" />
          <EquipmentWeight :equipment-items="characterEquipment" />
        </div>
      </template>
    </TableHeader>

    <div v-if="!isCollapsed" class="equipment-content">
      <!-- Empty State: No Equipment -->
      <div v-if="characterEquipment.length === 0" class="empty-table-state">
        <p class="empty-table-message">No equipment</p>
        <p v-if="internalEditMode" class="empty-table-hint">Click the + button above to add your first equipment</p>
      </div>

      <!-- Grouped Display -->
      <GroupedThreeColumnLayout v-else-if="hasEquipmentGrouping" :grouped-items="groupedEquipmentItems"
        :draggable="isDraggable" :custom-group-mode="groupingOption === 'custom'"
        custom-group-id="equipment-custom-group" @reorder-group="onEquipmentGroupReorder"
        @rename-group="renameEquipmentGroup" @delete-group="deleteEquipmentGroup">
        <template #default="{ item }">
          <template v-if="item.equipment">
            <EquipmentCard :equipment="item.equipment" :collapsed="item.collapsed || false"
              :editable="item.equipment.isCustom" class="equipment-card" @edit="openEditEquipmentModal"
              @update="handleCharacterUpdate" :collapsible="true" :show-keeping-badge="true"
              :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="item.showImprovements"
              :show-discovery-badge="item.equipment.subtype === MESMER_MASK_SUBTYPE_ID" :show-difficulty-badge="true"
              @update:collapsed="updateEquipmentCollapsed(item.id, $event)"
              @update:showImprovements="updateEquipmentShowImprovements(item, $event)" :engagement-success-options="[]"
              :enable-damage-roll="true" @roll-damage="handleDamageRoll" @roll-link="handleRollLink" />
            <EquipmentDetails :equipment-item="item" :item-id="item.id" :is-edit-mode="canEdit"
              @update-carried="handleCarriedChange" @update-wielding="handleWieldingChange"
              @update-quantity="handleQuantityChange" />
          </template>
          <span v-else class="missing-item">Unknown item</span>
        </template>
      </GroupedThreeColumnLayout>

      <!-- Ungrouped Display -->
      <ThreeColumnLayout v-else :items="characterEquipment" :is-draggable="isDraggable" group-id="equipment"
        @reorder="handleEquipmentReorder">
        <template #default="{ item }">
          <template v-if="item.equipment">
            <EquipmentCard :equipment="item.equipment" :collapsed="item.collapsed || false"
              :editable="item.equipment.isCustom" class="equipment-card" @edit="openEditEquipmentModal"
              @update="handleCharacterUpdate" :collapsible="true" :show-keeping-badge="true"
              :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="item.showImprovements"
              :show-discovery-badge="item.equipment.subtype === MESMER_MASK_SUBTYPE_ID" :show-difficulty-badge="true"
              @update:collapsed="updateEquipmentCollapsed(item.id, $event)"
              @update:showImprovements="updateEquipmentShowImprovements(item, $event)" :engagement-success-options="[]"
              :enable-damage-roll="true" @roll-damage="handleDamageRoll" @roll-link="handleRollLink" />
            <EquipmentDetails :equipment-item="item" :item-id="item.id" :is-edit-mode="canEdit"
              @update-carried="handleCarriedChange" @update-wielding="handleWieldingChange"
              @update-quantity="handleQuantityChange" />
          </template>
          <span v-else class="missing-item">Unknown item</span>
        </template>
      </ThreeColumnLayout>
    </div>

    <!-- Equipment Selector -->
    <CardCascadePicker v-if="showEquipmentSelector" :picker="equipmentPicker" fixed-category="equipment"
      :show-category-column="false" :close-on-mouse-leave="false" :close-on-outside-click="true"
      :anchor-position="equipmentSelectorAnchor" :is-loading="false" top-level-action-label="Create custom item..."
      :show-add-all-at-every-level="false" @add-item="handleCascadeAddEquipment"
      @add-all-items="handleCascadeAddAllEquipment" @top-level-action="createAndAddCustomEquipment" />

    <!-- Edit Equipment Modal -->
    <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
      @close="closeEditEquipmentModal" @delete="deleteEquipment" />

    <!-- Skill Check Modal -->
    <SkillCheckModal v-if="showSkillCheckModal" :selected-skill-name="rollLinkSkill" :character="selectedCharacter"
      :default-roll-type="rollLinkRollType" @close="showSkillCheckModal = false" />

    <!-- Martial Training Popup -->
    <MartialTrainingModal v-if="showMartialTrainingModal" :novizio="characterMestiereNovizio"
      :equipment-grades="equipmentGradesStore.items" :mestiere-name="characterMestiere?.name"
      :anchor-el="martialTrainingAnchorEl" @close="showMartialTrainingModal = false" />

  </CharacterSheetSection>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EquipmentWeight from './EquipmentWeight.vue'
import EquipmentDetails from './EquipmentDetails.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import CardCascadePicker from '@/components/ui/pickers/CardCascadePicker.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import ThreeColumnLayout from '@/components/ui/layouts/ThreeColumnLayout.vue'
import GroupedThreeColumnLayout from '@/components/ui/layouts/GroupedThreeColumnLayout.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import MartialTrainingModal from '@/components/features/characterSheet/modals/MartialTrainingModal.vue'
import { useEditModal } from '@/composables/useEditModal'
import CharacterService from '@/services/entities/characterService'
import { useCardCascadePicker } from '@/composables/useCardCascadePicker'
import { anchorFromTriggerEvent } from '@/composables/useAnchoredPickerTrigger'
import { useItemGrouping } from '@/composables/useItemGrouping'
import { useCustomGroupManagement } from '@/composables/useCustomGroupManagement'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS } from '@/constants/sortOptions'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useRollsStore } from '@/stores/rollsStore'
import EngagementSuccessService from '@/services/entities/engagementSuccessService'
import DamageRollService from '@/services/rolls/damageRollService'
import CustomRollService from '@/services/rolls/customRollService'
import { RollTypes } from '@/constants/rollTypes'
import { MESMER_MASK_SUBTYPE_ID } from '@/constants/mesmerConstants'
import { getModifierStatKey, getModifierStatLabel } from '@/utils/characterKeyUtils'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: false
  },
  character: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['edit-custom-equipment'])

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => props.character || charactersStore.selectedCharacter)
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentStore = useEquipmentStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const keepingStore = useKeepingStore()
const sourcesStore = useSourcesStore()
const rollsStore = useRollsStore()
const conceptsStore = useConceptsStore()

const characterMestiere = computed(() => {
  if (!selectedCharacter.value?.mestiereId) return null
  return conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId) ?? null
})
const characterMestiereNovizio = computed(() => characterMestiere.value?.novizio ?? null)

const showMartialTrainingModal = ref(false)
const martialTrainingAnchorEl = ref(null)

const openMartialTraining = (event) => {
  martialTrainingAnchorEl.value = event.currentTarget
  showMartialTrainingModal.value = true
}

const allEquipment = computed(() => equipmentStore.equipment || [])
const engagementSuccessOptions = ref([])

const {
  showModal: showEditEquipmentModal,
  itemToEdit: equipmentToEdit,
  openModal: openEditEquipmentModal,
  closeModal: closeEditEquipmentModal
} = useEditModal()

const internalEditMode = ref(false)
const isCollapsed = ref(false)

// Roll link modal refs
const showSkillCheckModal = ref(false)
const rollLinkSkill = ref(null)
const rollLinkRollType = ref(null)

const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const sortOptions = EQUIPMENT_SORT_OPTIONS

const groupingOptions = [
  { value: 'source', label: 'Source' },
  { value: 'custom', label: 'Custom' }
]

// Grouping and Sorting state
const groupingOption = computed({
  get: () => {
    if (selectedCharacter.value?.groupEquipmentByCustom) return 'custom'
    if (selectedCharacter.value?.groupEquipmentBySource) return 'source'
    return ''
  },
  set: (value) => {
    // Both flags are set explicitly to ensure they are mutually exclusive
    if (selectedCharacter.value) {
      selectedCharacter.value.groupEquipmentBySource = (value === 'source')
      selectedCharacter.value.groupEquipmentByCustom = (value === 'custom')
    }
  }
})

// Custom groups stored on the character, exposed as a computed ref for useItemGrouping
const equipmentCustomGroups = computed(() => selectedCharacter.value?.equipmentCustomGroups ?? [])

const {
  handleFlatReorder: handleEquipmentReorder,
  onGroupReorder: onEquipmentGroupReorder,
  createGroup: createEquipmentGroup,
  renameGroup: renameEquipmentGroup,
  deleteGroup: deleteEquipmentGroup
} = useCustomGroupManagement(selectedCharacter, 'equipment', 'equipmentCustomGroups', groupingOption)

const equipmentSortOption = computed({
  get: () => selectedCharacter.value?.equipmentSortOption || '',
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.equipmentSortOption = value
    }
  }
})

const canEdit = computed(() => props.isEditMode)

// Drag is enabled only when no sort option is active (custom order mode)
const isDraggable = computed(() => !equipmentSortOption.value)

const equipmentPicker = useCardCascadePicker({ fixedCategory: 'equipment' })
const {
  showPicker: showEquipmentSelector,
  openPicker: openEquipmentSelector,
  closeCascadeImmediate: closeEquipmentSelector,
} = equipmentPicker

const equipmentSelectorAnchor = ref({ x: 0, y: 0 })

const openEquipmentSelectorFromButton = (event) => {
  const anchor = anchorFromTriggerEvent(event)
  if (anchor) equipmentSelectorAnchor.value = anchor
  openEquipmentSelector()
}

const characterEquipment = computed(() => {
  if (!selectedCharacter.value?.equipment) return []

  const equipment = selectedCharacter.value.equipment.map((entry, index) => {
    const eq = allEquipment.value.find((eq) => eq.id === entry.id)
    return {
      ...entry,
      equipment: eq,
      collapsed: entry.collapsed ?? true,
      showImprovements: entry.showImprovements ?? false,
      columnIndex: entry.columnIndex ?? (index % 3)
    }
  })

  return sortItems(
    equipment.map(item => ({ ...item, ...item.equipment })),
    equipmentSortOption.value
  ).map(sorted => {
    const original = equipment.find(e => e.id === sorted.id)
    return {
      id: sorted.id,
      quantity: original.quantity,
      isCarried: original.isCarried,
      isWielding: original.isWielding,
      collapsed: original.collapsed,
      showImprovements: original.showImprovements,
      source: sorted.source,
      equipment: sorted.equipment,
      columnIndex: original.columnIndex,
      customGroupId: original.customGroupId ?? null
    }
  })
})

const { groupedItems: groupedEquipmentItems, hasGrouping: hasEquipmentGrouping } = useItemGrouping(
  characterEquipment,
  groupingOption,
  sourcesStore,
  equipmentCustomGroups
)

const isCreatingCustom = ref(false)

const createAndAddCustomEquipment = async () => {
  if (isCreatingCustom.value) return

  isCreatingCustom.value = true

  try {
    const createdEquipment = await equipmentStore.createCustomEquipment()

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

const getEquipmentIndex = (itemId) => {
  if (!selectedCharacter.value?.equipment) return -1
  return selectedCharacter.value.equipment.findIndex(e => e.id === itemId)
}

const handleCarriedChange = (itemId, isCarried) => {
  const index = getEquipmentIndex(itemId)
  if (index === -1) return

  selectedCharacter.value.equipment[index].isCarried = isCarried

  if (!isCarried && selectedCharacter.value.equipment[index].isWielding) {
    selectedCharacter.value.equipment[index].isWielding = false
  }
}

const handleWieldingChange = (itemId, isWielding) => {
  const index = getEquipmentIndex(itemId)
  if (index === -1) return

  const currentItem = selectedCharacter.value.equipment[index]
  selectedCharacter.value.equipment[index].isWielding = isWielding && currentItem.isCarried
}

const handleQuantityChange = (itemId, quantity) => {
  const index = getEquipmentIndex(itemId)
  if (index === -1) return

  selectedCharacter.value.equipment[index].quantity = Math.max(1, quantity)
}

const handleCharacterUpdate = (updatedCharacter) => {
  if (updatedCharacter && selectedCharacter.value) {
    Object.assign(selectedCharacter.value, updatedCharacter)
  }
}

const handleDamageRoll = (equipment) => {
  if (!equipment || !selectedCharacter.value) return

  const rollResult = DamageRollService.makeEquipmentDamageRoll(equipment, selectedCharacter.value)
  if (rollResult) {
    rollsStore.setRoll(rollResult)
  }
}

const handleRollLink = (rollData) => {
  if (!selectedCharacter.value) return

  if (rollData.type === 'skill-check' || rollData.type === 'opposed-skill-check') {
    rollLinkSkill.value = rollData.skill
    rollLinkRollType.value = rollData.type === 'opposed-skill-check'
      ? RollTypes.OPPOSED_SKILL_CHECK
      : RollTypes.SKILL_CHECK
    showSkillCheckModal.value = true
  } else if (rollData.type === 'damage-roll') {
    // Transform dice format from [{count, sides}] to [{dieSize}...]
    const dicePool = []
    rollData.dice.forEach(die => {
      for (let i = 0; i < die.count; i++) {
        dicePool.push({ dieSize: die.sides })
      }
    })

    // Calculate modifier value
    let modifierValue = 0
    let modifierLabel = 'Modifier'

    if (rollData.modifier) {
      if (rollData.modifier.type === 'stat') {
        const statName = getModifierStatKey(rollData.modifier)
        modifierValue = selectedCharacter.value[statName] || 0
        modifierLabel = getModifierStatLabel(rollData.modifier)
      } else if (rollData.modifier.type === 'number') {
        modifierValue = rollData.modifier.value
      }
    }

    const rollResult = DamageRollService.makeDamageRoll(
      dicePool,
      modifierValue,
      selectedCharacter.value,
      {
        sourceName: 'Description',
        modifierLabel,
        footer: modifierValue !== 0 ? `${modifierValue >= 0 ? '+' : ''}${modifierLabel}` : undefined
      }
    )
    if (rollResult) {
      rollsStore.setRoll(rollResult)
    }
  } else if (rollData.type === 'custom-roll') {
    // Transform dice format from [{count, sides}] to [{dieSize}...]
    const dicePool = []
    rollData.dice.forEach(die => {
      for (let i = 0; i < die.count; i++) {
        dicePool.push({ dieSize: die.sides })
      }
    })

    // Calculate modifier value
    let modifierValue = 0

    if (rollData.modifier) {
      if (rollData.modifier.type === 'stat') {
        const statName = getModifierStatKey(rollData.modifier)
        modifierValue = selectedCharacter.value[statName] || 0
      } else if (rollData.modifier.type === 'number') {
        modifierValue = rollData.modifier.value
      }
    }

    const rollResult = CustomRollService.makeCustomRoll(
      dicePool,
      modifierValue,
      selectedCharacter.value,
      { label: rollData.linkText }
    )
    if (rollResult) {
      rollsStore.setRoll(rollResult)
    }
  }
}

const updateEquipmentShowImprovements = (item, showImprovements) => {
  if (!selectedCharacter.value?.equipment) return
  const index = selectedCharacter.value.equipment.findIndex(e => e.id === item.id)
  if (index !== -1) {
    selectedCharacter.value.equipment[index].showImprovements = showImprovements
  }
}

const updateEquipmentCollapsed = (itemId, collapsed) => {
  if (!selectedCharacter.value?.equipment) return
  const index = selectedCharacter.value.equipment.findIndex(e => e.id === itemId)
  if (index !== -1) {
    selectedCharacter.value.equipment[index].collapsed = collapsed
  }
}

const allEquipmentExpanded = computed(() =>
  characterEquipment.value.length > 0 &&
  characterEquipment.value.every(e => !e.collapsed)
)

const toggleAllEquipment = () => {
  if (!selectedCharacter.value?.equipment) return
  const collapse = allEquipmentExpanded.value
  for (const e of selectedCharacter.value.equipment) {
    e.collapsed = collapse
  }
}

const saveEditedEquipment = async (updatedEquipment) => {
  await equipmentStore.update(updatedEquipment)
  closeEditEquipmentModal()
}

const deleteEquipment = async (equipment) => {
  await equipmentStore.remove(equipment)
  closeEditEquipmentModal()
}

const addEquipmentById = (equipmentId) => {
  const newItem = {
    id: equipmentId,
    quantity: 1,
    isCarried: true,
    isWielding: false,
    collapsed: false,
  }

  const updated = CharacterService.addItem(selectedCharacter.value, 'equipment', newItem)
  return updated
}

const handleCascadeAddEquipment = (type, equipmentId) => {
  if (type !== 'equipment') return
  const updated = addEquipmentById(equipmentId)
  if (updated) {
    Object.assign(selectedCharacter.value, updated)
  }
  closeEquipmentSelector()
}

const handleCascadeAddAllEquipment = (type, equipmentItems) => {
  if (type !== 'equipment' || !Array.isArray(equipmentItems) || equipmentItems.length === 0) return
  let nextCharacter = selectedCharacter.value
  for (const equipment of equipmentItems) {
    const updated = CharacterService.addItem(nextCharacter, 'equipment', {
      id: equipment.id,
      quantity: 1,
      isCarried: true,
      isWielding: false,
      collapsed: false,
    })
    if (updated) {
      nextCharacter = updated
    }
  }
  if (nextCharacter !== selectedCharacter.value) {
    Object.assign(selectedCharacter.value, nextCharacter)
  }
  closeEquipmentSelector()
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
.header-right-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.missing-item {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.empty-table-state {
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  border-radius: var(--radius-4);
  margin: var(--space-lg) 0;
}

.empty-table-message {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-table-hint {
  font-size: var(--font-size-14);
  color: var(--color-text-tertiary);
  margin: 0;
}

.add-button-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.equipment-content {
  width: 100%;
  min-width: 0;
}

.equipment-card {
  position: relative;
  z-index: 1;
}

.masonry-item {
  position: relative;
}
</style>
