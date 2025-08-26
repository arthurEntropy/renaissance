<template>
  <CharacterSheetSection max-width="320px">

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="isEditMode" @toggle-edit="toggleEditMode">
      <template #header-right>
        <MPDisplay :mp="character.mp" @update:mp="(mpData) => emit('update-character', { ...character, mp: mpData })" />
      </template>
    </TableHeader>

    <!-- Static Abilities List (only in view mode) -->
    <div v-if="!isEditMode" class="abilities-list">
      <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability"
        :collapsed="getCollapsedState(ability)" @update:collapsed="setCollapsedState(ability, $event)"
        class="ability-card" :collapsible="true" :show-xp-badge="false" />
    </div>

    <!-- Draggable Abilities List (only in edit mode) -->
    <draggable v-else v-model="sortedAbilities" group="abilities" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-ability-row" animation="150" class="abilities-edit-list">
      <template #item="{ element: ability, index }">
        <div class="ability-row">

          <FloatingEditControls v-if="isEditMode" :index="index" delete-title="Remove ability"
            drag-title="Drag to reorder" @delete="removeAbility" />

          <AbilityCard v-if="ability" :ability="ability" :collapsed="getCollapsedState(ability)"
            @update:collapsed="setCollapsedState(ability, $event)" class="ability-card" :collapsible="true"
            :show-xp-badge="false" />

          <span v-else class="missing-ability">Unknown ability</span>

        </div>
      </template>
    </draggable>

    <!-- Add Ability FAB (only in edit mode) -->
    <AddButton :show="showAddButton" @click="toggleAbilitySelector" title="Add ability" />

    <!-- Add Ability Selector Modal -->
    <ItemSelector :show="showAbilitySelector" title="Add Ability" :grouped-items="groupedAbilities"
      :search-query="abilitySearchQuery" search-placeholder="Search abilities..." no-items-message="No abilities found"
      :get-source-name="sourceUtils.getSourceName" @close="toggleAbilitySelector" @select="selectAbility"
      @search="handleAbilitySearch" />

  </CharacterSheetSection>
</template>

<script setup>
import { computed } from 'vue'
import AbilityCard from '@/components/ui/cards/AbilityCard.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingEditControls from '@/components/ui/controls/FloatingEditControls.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import AddButton from '@/components/ui/buttons/AddButton.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import MPDisplay from './MPDisplay.vue'
import draggable from 'vuedraggable'
import { useTableEditMode } from '@/composables/useTableEditMode'
import { useItemManagement } from '@/composables/useItemManagement'
import { useCollapseState } from '@/composables/useCollapseState'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useItemSelector } from '@/composables/useItemSelector'
import { useSourceUtils } from '@/composables/useSourceUtils'
import { useCharacterAbilities } from '@/composables/useCharacterAbilities'

// Props
const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  allAbilities: {
    type: Array,
    default: () => [],
  }
})

// Emits
const emit = defineEmits(['update-character'])

// Composables
const { isEditMode, toggleEditMode, showAddButton } = useTableEditMode()

// Item management for abilities
const abilityManagement = useItemManagement(
  computed(() => props.character),
  emit,
  'abilities',
  'ability'
)

const { getCollapsedState, setCollapsedState } = useCollapseState(true)

// Source management
const { sources, sourceUtils } = useSourceUtils()

// Item selector for abilities
const abilitySelector = useItemSelector(
  computed(() => props.allAbilities),
  sources,
  sourceUtils,
  { searchFields: ['name'] } // Only search ability names, not descriptions
)

// Extract what we need from the selector
const showAbilitySelector = abilitySelector.showSelector
const abilitySearchQuery = abilitySelector.searchQuery
const groupedAbilities = abilitySelector.groupedItems
const toggleAbilitySelector = abilitySelector.toggleSelector
const filterAbilities = abilitySelector.filterItems

// Character abilities transformation
const { characterAbilityObjects: characterAbilities } = useCharacterAbilities(
  computed(() => props.character.abilities),
  computed(() => props.allAbilities),
  'order'
)

// Drag and drop functionality
const updateAbilityOrder = (newOrder) => {
  // Extract the IDs from the ability objects in the new order
  const updatedAbilityIds = newOrder.map((ability) => ability.id)
  abilityManagement.reorderItems(updatedAbilityIds)
}

const {
  sortedItems: sortedAbilities,
  onDragEnd
} = useDragAndDrop(characterAbilities, updateAbilityOrder, 'order')

// Methods
// Ability Management
const removeAbility = (index) => {
  if (!isEditMode.value) return

  abilityManagement.removeItem(index, {
    getDisplayName: (ability) => ability?.name || 'this ability',
    confirmMessage: (name) => `Are you sure you want to remove ${name} from your character?`
  })
}

// Ability Selector
const handleAbilitySearch = (value) => {
  abilitySearchQuery.value = value
  filterAbilities()
}

const selectAbility = (ability) => {
  // Add ability to character's abilities list using the item management composable
  abilityManagement.addItem(ability.id, {
    preventDuplicates: true,
    compareProperty: null // Compare the actual values since we're storing IDs
  })

  toggleAbilitySelector()
}


</script>

<style scoped>
.abilities-list,
.abilities-edit-list {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ability-row {
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
}

.ability-row .ability-card {
  flex: 1 1 0%;
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.missing-ability {
  color: var(--color-gray-light);
  font-style: italic;
  padding: var(--space-md);
}

.ghost-ability-row {
  opacity: 0.5;
  background: var(--overlay-white-subtle);
  border: 2px dashed var(--color-gray-light);
  border-radius: var(--radius-5);
}

@media (max-width: var(--breakpoint-sm)) {
  .ability-card {
    width: 90%;
  }
}
</style>
