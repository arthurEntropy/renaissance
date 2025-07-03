<template>
  <div class="abilities-table">
    <!-- TITLE with Edit toggle -->
    <div class="abilities-table-header">
      <h2>Abilities</h2>
      <!-- Edit mode toggle button moved next to title -->
      <button class="edit-mode-button" @click="toggleEditMode"
        :title="isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'">
        {{ isEditMode ? '✓' : '✎' }}
      </button>
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
        :sources="sources" class="ability-card" :collapsible="true" :show-xp-badge="false" />
    </div>

    <!-- DRAGGABLE ABILITY ROWS (only in edit mode) -->
    <draggable v-else v-model="sortedAbilities" group="abilities" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-ability-row" animation="150" class="abilities-edit-list">
      <template #item="{ element: ability, index }">
        <div class="ability-row">
          <!-- Edit Mode Controls (left, stacked) -->
          <div class="edit-controls">
            <span @click="removeAbility(index)" class="delete-item-link">ⓧ</span>
            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
          </div>
          <!-- Ability Card -->
          <AbilityCard v-if="ability" :ability="ability" :collapsed="getCollapsedState(ability)"
            @update:collapsed="setCollapsedState(ability, $event)" :sources="sources" class="ability-card"
            :collapsible="true" :show-xp-badge="false" />
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
            <div class="source-header">{{ getSourceName(source) }}</div>
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

<script>
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import AbilityCard from '@/components/AbilityCard.vue'
import draggable from 'vuedraggable'
import NumberInput from '@/components/NumberInput.vue'

export default {
  props: {
    character: {
      type: Object,
      required: true,
    },
    allAbilities: {
      type: Array,
      default: () => [],
    },
    sources: {
      type: Object,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: []
      })
    }
  },
  emits: ['update-character'],
  components: {
    AbilityCard,
    draggable,
    NumberInput,
  },
  data() {
    return {
      isEditMode: false,
      showAbilitySelector: false,
      abilitySearchQuery: '',
      filteredAbilities: [],
      abilitiesStore: useAbilitiesStore(),
      abilityCollapseState: {}, // Track collapsed/expanded state by ability ID
    }
  },
  computed: {
    characterAbilities() {
      // Get the full ability objects for the character's abilities
      const allAbilities = this.allAbilities || []
      return (
        this.character.abilities
          ?.map((abilityId) => {
            return (
              allAbilities.find((ability) => ability.id === abilityId) || null
            )
          })
          .filter((ability) => ability !== null) || []
      )
    },
    sortedAbilities: {
      get() {
        // Sort by order property (if exists)
        return [...this.characterAbilities].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          // If order is not defined, use original index
          return 0
        })
      },
      set(value) {
        // This will be called when draggable updates the order
        if (this.isEditMode) {
          this.updateAbilityOrder(value)
        }
      },
    },
    groupedAbilities() {
      const grouped = {
        general: [], // For items without a source or with an unknown source
      }

      const items =
        this.filteredAbilities.length > 0
          ? this.filteredAbilities
          : this.allAbilities || []

      // Group items
      items
        .filter((item) => !item.isDeleted)
        .forEach((item) => {
          const sourceId = item.source;
          const source = sourceId ? this.getSourceById(sourceId) : null;

          if (!sourceId || !source) {
            // Items without a source or with an unrecognized source go to the general group
            grouped.general.push(item);
          } else {
            // All other items are grouped by their source
            if (!grouped[sourceId]) {
              grouped[sourceId] = [];
            }
            grouped[sourceId].push(item);
          }
        });

      // Sort items within each group by name
      Object.keys(grouped).forEach((key) => {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name))
      })

      // Return a new ordered object to control the display order
      const orderedGrouped = {}

      // 1. General items first (if any exist)
      if (grouped.general.length > 0) {
        orderedGrouped.general = grouped.general
      }

      // 2. Add all other source groups (sorted alphabetically by source name)
      const sourceKeys = Object.keys(grouped)
        .filter((key) => key !== 'general')
        .sort((a, b) => {
          const sourceNameA = this.getSourceName(a)
          const sourceNameB = this.getSourceName(b)
          return sourceNameA.localeCompare(sourceNameB)
        })

      sourceKeys.forEach((key) => {
        orderedGrouped[key] = grouped[key]
      })

      return orderedGrouped
    },
  },
  methods: {
    // Edit Mode Toggle
    toggleEditMode() {
      this.isEditMode = !this.isEditMode
      // Close the selector if we're exiting edit mode
      if (!this.isEditMode) {
        this.showAbilitySelector = false
      }
    },

    // MP Management
    updateMpCurrent(value) {
      if (!isNaN(value)) {
        const updatedCharacter = {
          ...this.character,
          mp: {
            ...this.character.mp,
            current: value,
          },
        }
        this.$emit('update-character', updatedCharacter)
      }
    },

    updateMpMax(value) {
      if (!isNaN(value)) {
        const updatedCharacter = {
          ...this.character,
          mp: {
            ...this.character.mp,
            max: value,
          },
        }
        this.$emit('update-character', updatedCharacter)
      }
    },

    // Ability Order Management
    updateAbilityOrder(newOrder) {
      // Update the abilities list with the new order
      if (!Array.isArray(newOrder) || newOrder.length === 0) return

      // Extract the IDs from the ability objects in the new order
      const updatedAbilityIds = newOrder.map((ability) => ability.id)

      // Create a new character object with updated abilities
      const updatedCharacter = {
        ...this.character,
        abilities: updatedAbilityIds,
      }

      // Emit the update event with the new character object
      this.$emit('update-character', updatedCharacter)
    },

    onDragEnd() {
      // This will be called after a drag operation completes
      // We don't need to do anything here since the v-model binding will handle the update
    },

    // Ability Management
    removeAbility(index) {
      if (!this.isEditMode) return

      const ability = this.characterAbilities[index]
      const name = ability ? ability.name : 'this ability'

      if (
        confirm(`Are you sure you want to remove ${name} from your character?`)
      ) {
        // Create a new array without the ability at the given index
        const updatedAbilities = this.character.abilities.filter(
          (_, i) => i !== index,
        )

        // Create a new character object with the updated abilities
        const updatedCharacter = {
          ...this.character,
          abilities: updatedAbilities,
        }

        // Emit the update event
        this.$emit('update-character', updatedCharacter)
      }
    },

    // Ability Selector
    toggleAbilitySelector(event) {
      if (!this.isEditMode) return

      if (event) {
        event.stopPropagation() // Prevent immediate closing
      }
      this.showAbilitySelector = !this.showAbilitySelector

      if (this.showAbilitySelector) {
        this.abilitySearchQuery = ''
        this.filteredAbilities = []
      }
    },

    filterAbilities() {
      const query = this.abilitySearchQuery.toLowerCase().trim()
      if (!query) {
        this.filteredAbilities = []
        return
      }

      this.filteredAbilities = (this.allAbilities || []).filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)),
      )
    },

    selectAbility(ability) {
      // Add ability to character's abilities list
      const currentAbilities = this.character.abilities || []

      // Only add if not already in the list
      if (!currentAbilities.includes(ability.id)) {
        const updatedCharacter = {
          ...this.character,
          abilities: [...currentAbilities, ability.id],
        }
        this.$emit('update-character', updatedCharacter)
      }

      this.toggleAbilitySelector()
    },

    // Collapsed/Expanded State Management
    getCollapsedState(ability) {
      // Default to true (collapsed) if not set
      return this.abilityCollapseState[ability.id] !== undefined
        ? this.abilityCollapseState[ability.id]
        : true
    },
    setCollapsedState(ability, collapsed) {
      this.abilityCollapseState = {
        ...this.abilityCollapseState,
        [ability.id]: collapsed
      }
    },

    getSourceById(sourceId) {
      if (!sourceId) return null;

      // Use sources passed as props if available
      return (
        this.sources.ancestries.find((item) => item.id === sourceId) ||
        this.sources.cultures.find((item) => item.id === sourceId) ||
        this.sources.mestieri.find((item) => item.id === sourceId) ||
        this.sources.worldElements.find((item) => item.id === sourceId) ||
        this.abilitiesStore.getSourceById(sourceId)
      );
    },

    getSourceName(sourceId) {
      if (sourceId === 'general') return 'General'

      const source = this.getSourceById(sourceId);
      return source ? source.name : 'General'
    },

    handleOutsideClick(event) {
      // References to the dropdown elements
      const abilitySelector = this.$el.querySelector(
        '.ability-selector-container',
      )

      // Close ability selector if clicking outside
      if (
        this.showAbilitySelector &&
        abilitySelector &&
        !abilitySelector.contains(event.target)
      ) {
        this.showAbilitySelector = false
      }
    },
  },
  mounted() {
    // Add click listener to detect clicks outside the dropdown
    document.addEventListener('click', this.handleOutsideClick)
  },
  beforeUnmount() {
    // Ensure dropdowns are closed when component is destroyed
    this.showAbilitySelector = false
    // Remove the click listener
    document.removeEventListener('click', this.handleOutsideClick)
  },
}
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
  background-color: black;
  padding: 15px;
  border-radius: 5px;
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
  border-radius: 50%;
  background: linear-gradient(135deg, #444 60%, #222 100%);
  color: #fff;
  font-size: 1.1rem;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  padding: 0;
}

.add-ability-fab:hover {
  background: linear-gradient(135deg, #666 60%, #333 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.mp-container {
  background-color: rgb(61, 61, 61);
  padding: 5px 15px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.mp-label {
  font-size: 14px;
  margin-right: 5px;
  font-style: italic;
}

/* Edit mode button */
.edit-mode-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-mode-button:hover {
  color: white;
}

/* MasonryGrid Styles */
.abilities-grid {
  width: 100%;
  min-height: 50px;
  margin-bottom: 10px;
}

/* Draggable Styles */
.ability-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: -2px;
  width: 100%;
}

.ability-row .ability-card {
  flex: 1 1 0%;
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.edit-controls {
  display: flex;
  flex-direction: column;
  margin: 7px 5px 0 0;
}

.missing-ability {
  color: #888;
  font-style: italic;
  padding: 10px;
}

.delete-item-link {
  cursor: pointer;
  color: gray;
  font-size: 15px;
  text-align: center;
  margin: 0;
}

.delete-item-link:hover {
  color: #ff6b6b;
}

.drag-handle {
  cursor: move;
  font-size: 16px;
  color: #777;
  user-select: none;
  margin: 0;
}

.drag-handle:hover {
  color: white;
}

/* Ghost row style for dragging */
.ghost-ability-row {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed #777;
  border-radius: 5px;
}

/* Ability Selector Styles */
.ability-selector-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 500px;
  max-height: 80vh;
  background-color: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.ability-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.ability-search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 16px;
}

.close-selector {
  font-size: 24px;
  margin-left: 15px;
  cursor: pointer;
  color: #aaa;
}

.close-selector:hover {
  color: white;
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
  font-weight: bold;
  color: #aaa;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.ability-option {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.ability-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.ability-cost {
  color: #aaa;
  font-size: 0.9em;
  margin-left: 5px;
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
