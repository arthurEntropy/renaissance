<template>
  <CharacterSheetSection max-width="375px">

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="internalEditMode" :show-edit-button="canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <MPDisplay :mp="selectedCharacter.mp" :is-edit-mode="canEdit" />
      </template>
    </TableHeader>

    <!-- Static Abilities List (only in view mode) -->
    <div v-if="!internalEditMode" class="abilities-list">
      <AbilityCard v-for="ability in sortedAbilities" :key="`ability-${ability.id}`" :ability="ability"
        :collapsed="ability.collapsed" @update:collapsed="updateAbilityCollapsed(ability, $event)" class="ability-card"
        :collapsible="true" :improvements="ability.improvements || []" :show-xp-badge="true"
        :show-add-to-character="false" :show-action-buttons="true" :character="character"
        :show-improvement-toggle="true" :show-improvements="ability.showImprovements"
        @update:showImprovements="updateAbilityShowImprovements(ability, $event)" />
    </div>

    <!-- Draggable Abilities List (only in edit mode) -->
    <draggable v-else v-model="sortedAbilities" group="abilities" handle=".drag-handle" item-key="id" @end="onDragEnd"
      ghost-class="ghost-ability-row" animation="150" class="abilities-edit-list">
      <template #item="{ element: ability, index }">
        <div class="ability-row">

          <FloatingEditControls v-if="internalEditMode" :index="index" delete-title="Remove ability"
            drag-title="Drag to reorder" @delete="removeAbility" />

          <AbilityCard v-if="ability" :ability="ability" :collapsed="ability.collapsed"
            @update:collapsed="updateAbilityCollapsed(ability, $event)" class="ability-card" :collapsible="true"
            :improvements="ability.improvements || []" :show-xp-badge="true" :show-add-to-character="false"
            :show-action-buttons="true" :character="character" :show-improvement-toggle="true"
            :show-improvements="ability.showImprovements"
            @update:showImprovements="updateAbilityShowImprovements(ability, $event)"
            :key="`edit-ability-${ability.id}`" />

          <span v-else class="missing-ability">Unknown ability</span>

        </div>
      </template>
    </draggable>

    <!-- Add Ability FAB (only in edit mode) -->
    <AddButton :show="showAddButton" @click="toggleAbilitySelector" title="Add ability" />

    <!-- Add Ability Selector Modal -->
    <ItemSelector :show="showAbilitySelector" title="Add Ability" :grouped-items="groupedAbilities"
      :search-query="abilitySearchQuery" search-placeholder="Search abilities..." no-items-message="No abilities found"
      :get-source-name="sourcesStore.getSourceName" @close="toggleAbilitySelector" @select="selectAbility"
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
import { useSimpleEditMode } from '@/composables/useEditMode'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useCharactersStore } from '@/stores/charactersStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { storeToRefs } from 'pinia'

// Props
const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  allAbilities: {
    type: Array,
    default: () => [],
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
})

// Store
const charactersStore = useCharactersStore()
const { selectedCharacter } = storeToRefs(charactersStore)

// Internal edit mode management
const { isEditMode: internalEditMode, toggleEditMode } = useSimpleEditMode()

// Character sheet edit mode only controls whether edit button is visible
const canEdit = computed(() => props.isEditMode)

// Show add button when internal edit mode is active
const showAddButton = computed(() => internalEditMode.value)

// Source management
const sourcesStore = useSourcesStore()

// Item selector for abilities
const abilitySelector = useItemSelector(
  computed(() => props.allAbilities),
  sourcesStore,
  { searchFields: ['name'] } // Only search ability names, not descriptions
)

// Extract what we need from the selector
const showAbilitySelector = abilitySelector.showSelector
const abilitySearchQuery = abilitySelector.searchQuery
const groupedAbilities = abilitySelector.groupedItems
const toggleAbilitySelector = abilitySelector.toggleSelector
const filterAbilities = abilitySelector.filterItems

// Character abilities - merge character refs with full ability definitions
const characterAbilities = computed(() => {
  const allAbilitiesArray = props.allAbilities || []
  if (!props.character?.abilities) return []
  return (
    props.character.abilities
      ?.map((abilityObj, index) => {
        const ability = allAbilitiesArray.find((a) => a.id === abilityObj.id)

        if (!ability) return null

        const { improvements: characterImprovements, ...otherMetadata } = abilityObj

        return {
          ...ability,
          ...otherMetadata,
          improvements: ability.improvements || [],
          characterImprovements: characterImprovements || {},
          collapsed: abilityObj.collapsed ?? true,
          showImprovements: abilityObj.showImprovements ?? false,
          order: index
        }
      })
      .filter((ability) => ability !== null) || []
  )
})

// Drag and drop - sorted abilities with reorder callback
const sortedAbilities = computed({
  get: () => [...characterAbilities.value].sort((a, b) => (a.order || 0) - (b.order || 0)),
  set: (newOrder) => {
    const updatedAbilities = newOrder.map((ability) => ({
      id: ability.id,
      collapsed: ability.collapsed,
      showImprovements: ability.showImprovements
    }))

    const updated = CharacterService.reorderItems(selectedCharacter.value, 'abilities', updatedAbilities)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
})

const onDragEnd = () => {
  // Ability reordering handled by sortedAbilities setter
}

// Methods
// Ability Management
const removeAbility = (index) => {
  if (!internalEditMode.value) return

  const ability = selectedCharacter.value.abilities[index]
  const abilityData = props.allAbilities.find(a => a.id === ability.id)
  const abilityName = abilityData?.name || 'this ability'

  if (confirm(`Are you sure you want to remove ${abilityName}?`)) {
    const updated = CharacterService.removeItem(selectedCharacter.value, 'abilities', index)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
}

// Ability Selector
const handleAbilitySearch = (value) => {
  abilitySearchQuery.value = value
  filterAbilities()
}

const selectAbility = (ability) => {
  const updated = CharacterService.addItem(selectedCharacter.value, 'abilities', {
    id: ability.id,
    collapsed: true,
    showImprovements: false
  })
  if (updated) Object.assign(selectedCharacter.value, updated)
  toggleAbilitySelector()
}

// Handle ability collapsed state changes
const updateAbilityCollapsed = (ability, collapsed) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    // Create a copy of the item with the new collapsed state
    const updatedItem = { ...selectedCharacter.value.abilities[index], collapsed }

    // Create a copy of the abilities array with the updated item to ensure reactivity
    const newAbilities = [...selectedCharacter.value.abilities]
    newAbilities[index] = updatedItem

    // Update the character's abilities array
    selectedCharacter.value.abilities = newAbilities
  }
}

// Handle ability showImprovements state changes
const updateAbilityShowImprovements = (ability, showImprovements) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    // Create a copy of the item with the new showImprovements state
    const updatedItem = { ...selectedCharacter.value.abilities[index], showImprovements }

    // Create a copy of the abilities array with the updated item to ensure reactivity
    const newAbilities = [...selectedCharacter.value.abilities]
    newAbilities[index] = updatedItem

    // Update the character's abilities array
    selectedCharacter.value.abilities = newAbilities
  }
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
