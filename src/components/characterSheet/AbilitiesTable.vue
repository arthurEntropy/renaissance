<template>
  <div class="abilities-table">
    <!-- TITLE with Edit toggle -->
    <div class="abilities-table-header edit-trigger">
      <h2>Abilities</h2>
      <!-- Edit mode toggle button moved next to title -->
      <EditButton size="small" visibility="on-hover" :is-edit-mode="isEditMode" @click="toggleEditMode" />
      <div class="header-right">
        <div class="mp-container">
          <span class="mp-label">MP:</span>
          <NumberInput :model-value="character.mp.current" @update:model-value="updateMpCurrent" :min="0"
            size="small" />
          <span>/</span>
          <NumberInput :model-value="character.mp.max" @update:model-value="updateMpMax" :min="0" size="small" />
        </div>
      </div>
    </div>

    <!-- Using MasonryGrid with draggable -->
    <div v-if="!isEditMode" class="abilities-list">
      <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability"
        :collapsed="getCollapsedState(ability)" @update:collapsed="setCollapsedState(ability, $event)"
        class="ability-card" :collapsible="true" :show-xp-badge="false" />
    </div>

    <!-- DRAGGABLE ABILITY ROWS (only in edit mode) -->
    <draggable v-else v-model="sortedAbilities" group="abilities" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-ability-row" animation="150" class="abilities-edit-list">
      <template #item="{ element: ability, index }">
        <div class="ability-row">
          <!-- Floating Edit Controls (left, vertical, partly outside row) -->
          <div v-if="isEditMode" class="floating-edit-controls">
            <button @click="removeAbility(index)" class="fab-delete" title="Remove ability" type="button">ⓧ</button>
            <span class="fab-drag drag-handle" title="Drag to reorder">⋮⋮</span>
          </div>
          <!-- Ability Card -->
          <AbilityCard v-if="ability" :ability="ability" :collapsed="getCollapsedState(ability)"
            @update:collapsed="setCollapsedState(ability, $event)" class="ability-card" :collapsible="true"
            :show-xp-badge="false" />
          <span v-else class="missing-ability">Unknown ability</span>
        </div>
      </template>
    </draggable>

    <!-- Add Ability Floating Button (only visible in edit mode) -->
    <button v-if="isEditMode" class="add-ability-fab" @click="toggleAbilitySelector($event)" title="Add ability"
      type="button">
      +
    </button>

    <!-- Ability Selector Dropdown -->
    <div v-if="showAbilitySelector" class="ability-selector-container">
      <div class="ability-selector-header">
        <input type="text" v-model="abilitySearchQuery" placeholder="Search abilities..." class="ability-search"
          @input="filterAbilities" />
        <span @click="toggleAbilitySelector()" class="close-selector">×</span>
      </div>
      <div class="ability-options-container">
        <template v-for="(items, source) in groupedAbilities" :key="source">
          <div class="ability-source-group">
            <div class="source-header">{{ sourceUtils.getSourceName(source) }}</div>
            <div v-for="item in items" :key="item.id" class="ability-option" @click="selectAbility(item)">
              {{ item.name }}
              <span v-if="item.mp" class="ability-cost">({{ item.mp }} MP)</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import AbilityCard from '@/components/AbilityCard.vue'
import EditButton from '@/components/EditButton.vue'
import draggable from 'vuedraggable'
import NumberInput from '@/components/NumberInput.vue'
import { useSimpleEditMode } from '@/composables/useEditMode'
import { useCollapseState } from '@/composables/useCollapseState'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useItemSelector } from '@/composables/useItemSelector'
import { useSourcesStore } from '@/stores/sourcesStore'

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
const { isEditMode, toggleEditMode } = useSimpleEditMode()
const { getCollapsedState, setCollapsedState } = useCollapseState(true)

// Source management - using sources store
const sourcesStore = useSourcesStore()
const sources = sourcesStore.sources
const sourceUtils = {
  getSourceById: sourcesStore.getSourceById,
  getSourceName: sourcesStore.getSourceName,
  getSourceType: sourcesStore.getSourceType,
}

// Item selector for abilities
const {
  showSelector: showAbilitySelector,
  searchQuery: abilitySearchQuery,
  groupedItems: groupedAbilities,
  toggleSelector: toggleAbilitySelector,
  filterItems: filterAbilities
} = useItemSelector(computed(() => props.allAbilities), sources, sourceUtils)
// Computed properties
const characterAbilities = computed(() => {
  // Get the full ability objects for the character's abilities
  const allAbilities = props.allAbilities || []
  return (
    props.character.abilities
      ?.map((abilityId, index) => {
        const ability = allAbilities.find((ability) => ability.id === abilityId)
        return ability ? { ...ability, order: index } : null
      })
      .filter((ability) => ability !== null) || []
  )
})

// Drag and drop functionality
const updateAbilityOrder = (newOrder) => {
  // Update the abilities list with the new order
  if (!Array.isArray(newOrder) || newOrder.length === 0) return

  // Extract the IDs from the ability objects in the new order
  const updatedAbilityIds = newOrder.map((ability) => ability.id)

  // Create a new character object with updated abilities
  const updatedCharacter = {
    ...props.character,
    abilities: updatedAbilityIds,
  }

  // Emit the update event with the new character object
  emit('update-character', updatedCharacter)
}

const {
  sortedItems: sortedAbilities,
  onDragEnd
} = useDragAndDrop(characterAbilities, updateAbilityOrder, 'order')

// Methods
// MP Management
const updateMpCurrent = (value) => {
  if (!isNaN(value)) {
    const updatedCharacter = {
      ...props.character,
      mp: {
        ...props.character.mp,
        current: value,
      },
    }
    emit('update-character', updatedCharacter)
  }
}

const updateMpMax = (value) => {
  if (!isNaN(value)) {
    const updatedCharacter = {
      ...props.character,
      mp: {
        ...props.character.mp,
        max: value,
      },
    }
    emit('update-character', updatedCharacter)
  }
}

// Ability Management
const removeAbility = (index) => {
  if (!isEditMode.value) return

  const ability = characterAbilities.value[index]
  const name = ability ? ability.name : 'this ability'

  if (
    confirm(`Are you sure you want to remove ${name} from your character?`)
  ) {
    // Create a new array without the ability at the given index
    const updatedAbilities = props.character.abilities.filter(
      (_, i) => i !== index,
    )

    // Create a new character object with the updated abilities
    const updatedCharacter = {
      ...props.character,
      abilities: updatedAbilities,
    }

    // Emit the update event
    emit('update-character', updatedCharacter)
  }
}

// Ability Selector
const selectAbility = (ability) => {
  // Add ability to character's abilities list
  const currentAbilities = props.character.abilities || []

  // Only add if not already in the list
  if (!currentAbilities.includes(ability.id)) {
    const updatedCharacter = {
      ...props.character,
      abilities: [...currentAbilities, ability.id],
    }
    emit('update-character', updatedCharacter)
  }

  toggleAbilitySelector()
}

// Lifecycle hooks
onMounted(() => {
  // Composables handle their own lifecycle
})

onBeforeUnmount(() => {
  // Composables handle their own cleanup
})
</script>

<style scoped>
h2 {
  margin: 5px;
}

.abilities-column {
  display: flex;
  flex-direction: column;
}

.abilities-table {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: var(--color-black);
  padding: 15px;
  border-radius: var(--radius-5);
  position: relative;
}

.abilities-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
}

.abilities-list,
.abilities-edit-list {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Remove old add-item-footer styles */
.add-item-footer,
.add-item-text {
  display: none !important;
}

/* Floating Action Button for Add Ability */
.add-ability-fab {
  position: absolute;
  left: 50%;
  bottom: -11px;
  transform: translateX(-50%);
  z-index: 110;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-gray-medium) 60%, var(--color-gray-dark) 100%);
  color: var(--color-white);
  font-size: var(--font-size-18);
  border: none;
  box-shadow: 0 2px 8px var(--overlay-black-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  padding: 0;
}

.add-ability-fab:hover {
  background: linear-gradient(135deg, var(--color-gray-light) 60%, var(--color-gray-medium) 100%);
  box-shadow: 0 4px 16px var(--overlay-white-medium);
}

.mp-container {
  background-color: var(--color-gray-dark);
  padding: 5px 15px;
  border-radius: var(--radius-5);
  display: flex;
  align-items: center;
  gap: 5px;
}

.mp-label {
  font-size: var(--font-size-14);
  margin-right: 5px;
  font-style: italic;
}

/* Edit mode button */
.edit-mode-button {
  background: none;
  border: none;
  color: var(--color-gray-light);
  font-size: var(--font-size-18);
  cursor: pointer;
  transition: color 0.2s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-mode-button:hover {
  color: var(--color-white);
}

/* MasonryGrid Styles */
.abilities-grid {
  width: 100%;
  min-height: 50px;
  margin-bottom: 10px;
}

/* Draggable Styles */
.ability-row {
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  /* Removed margin-bottom: -2px; to fix gap inconsistency */
  width: 100%;
}

.ability-row .ability-card {
  flex: 1 1 0%;
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* Floating edit controls for each ability row */
.floating-edit-controls {
  position: absolute;
  left: -18px;
  top: 2px;
  transform: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 120;
  pointer-events: auto;
}

.edit-controls {
  display: none !important;
}

.missing-ability {
  color: var(--color-gray-light);
  font-style: italic;
  padding: 10px;
}

.delete-item-link {
  cursor: pointer;
  color: var(--color-gray-medium);
  font-size: var(--font-size-15);
  text-align: center;
  margin: 0;
}

.delete-item-link:hover {
  color: var(--color-danger);
}

.drag-handle {
  cursor: move;
  font-size: var(--font-size-16);
  color: var(--color-gray-light);
  user-select: none;
  margin: 0;
}

.drag-handle:hover {
  color: var(--color-white);
}

/* Ghost row style for dragging */
.ghost-ability-row {
  opacity: 0.5;
  background: var(--overlay-white-subtle);
  border: 2px dashed var(--color-gray-light);
  border-radius: var(--radius-5);
}

/* Ability Selector Styles */
.ability-selector-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 500px;
  max-height: 80vh;
  background-color: var(--overlay-black-heavy);
  border-radius: var(--radius-8);
  box-shadow: 0 4px 20px var(--overlay-black-heavy);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.ability-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--overlay-white-subtle);
}

.ability-search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-4);
  background-color: var(--overlay-white-subtle);
  color: var(--color-white);
  font-size: var(--font-size-16);
}

.close-selector {
  font-size: var(--font-size-24);
  margin-left: 15px;
  cursor: pointer;
  color: var(--color-gray-light);
}

.close-selector:hover {
  color: var(--color-white);
}

.ability-options-container {
  overflow-y: auto;
  max-height: calc(80vh - 60px);
  padding: 10px;
}

.ability-source-group {
  margin-bottom: 15px;
}

.source-header {
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-light);
  padding: 5px 0;
  border-bottom: 1px solid var(--overlay-white-subtle);
  margin-bottom: 8px;
}

.ability-option {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--radius-4);
  transition: background-color 0.2s;
}

.ability-option:hover {
  background-color: var(--overlay-white-subtle);
}

.ability-cost {
  color: var(--color-gray-light);
  font-size: var(--font-size-14);
  margin-left: 5px;
}

.fab-delete {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-danger);
  border: none;
  font-size: var(--font-size-16);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px var(--overlay-white-subtle);
  transition: background 0.2s, color 0.2s;
  padding: 0;
}

.fab-delete:hover {
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-white);
}

.fab-drag {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-gray-light);
  font-size: var(--font-size-18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  box-shadow: 0 1px 4px var(--overlay-white-subtle);
  transition: background 0.2s, color 0.2s;
}

.fab-drag:hover {
  /* Keep background unchanged on hover */
  background: linear-gradient(135deg, var(--color-gray-dark) 60%, var(--color-gray-medium) 100%);
  color: var(--color-gray-dark);
}

@media (max-width: 650px) {
  .abilities-table {
    width: 80%;
    margin: 10px;
    padding: 10px;
  }

  .mp-container {
    margin-top: 5px;
  }

  .ability-card {
    width: 90%;
  }
}
</style>
