<template>
  <CharacterSheetSection max-width="375px">

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="internalEditMode" :show-edit-button="canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <MPDisplay :is-edit-mode="canEdit" />
      </template>
    </TableHeader>

    <!-- Draggable Abilities List -->
    <draggable v-model="sortedAbilities" handle=".drag-handle" item-key="id" ghost-class="ghost-item-row"
      animation="150" :disabled="!internalEditMode" class="item-table-list">
      <template #item="{ element: ability, index }">
        <div class="item-table-row">

          <div v-if="internalEditMode" class="floating-edit-controls">
            <FloatingActionButton type="delete" size="small" visibility="always" @click="removeAbility(index)" />
            <FloatingActionButton type="drag" size="small" visibility="always" class="drag-handle" />
          </div>

          <AbilityCard v-if="ability" :ability="ability" :collapsed="ability.collapsed"
            @update:collapsed="updateAbilityCollapsed(ability, $event)" class="item-table-card ability-card"
            :collapsible="true" :show-xp-badge="true" :show-add-to-character="false" :show-action-buttons="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="ability.showImprovements"
            @update:showImprovements="updateAbilityShowImprovements(ability, $event)" />

          <span v-else class="missing-item">Unknown ability</span>

        </div>
      </template>
    </draggable>

    <!-- Add Ability FAB (only in edit mode) -->
    <div v-if="showAddButton" class="add-button-container">
      <FloatingActionButton type="add" size="large" visibility="always" @click="toggleAbilitySelector" />
    </div>

    <!-- Add Ability Selector Modal -->
    <ItemSelector :show="showAbilitySelector" title="Add Ability" :grouped-items="groupedAbilities"
      :search-query="abilitySearchQuery" search-placeholder="Search abilities..." no-items-message="No abilities found"
      :get-source-name="sourcesStore.getSourceName" @close="toggleAbilitySelector" @select="selectAbility"
      @search="abilitySearchQuery = $event" />

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import MPDisplay from './MPDisplay.vue'
import draggable from 'vuedraggable'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false
  }
})

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const abilitiesStore = useAbilitiesStore()
const allAbilities = computed(() => abilitiesStore.abilities || [])

const internalEditMode = ref(false)
const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const canEdit = computed(() => props.canEdit)
const showAddButton = computed(() => internalEditMode.value)

const sourcesStore = useSourcesStore()

const {
  showSelector: showAbilitySelector,
  searchQuery: abilitySearchQuery,
  groupedItems: groupedAbilities,
  toggleSelector: toggleAbilitySelector
} = useItemSelector(
  allAbilities,
  sourcesStore,
  { searchFields: ['name'] }
)

const characterAbilities = computed(() => {
  const allAbilitiesArray = allAbilities.value || []
  if (!selectedCharacter.value?.abilities) return []
  return (
    selectedCharacter.value.abilities
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

const removeAbility = (index) => {
  if (!internalEditMode.value || !selectedCharacter.value?.abilities?.[index]) return

  const ability = selectedCharacter.value.abilities[index]
  const abilityData = allAbilities.value.find(a => a.id === ability.id)
  const abilityName = abilityData?.name || 'this ability'

  if (confirm(`Are you sure you want to remove ${abilityName}?`)) {
    const updated = CharacterService.removeItem(selectedCharacter.value, 'abilities', index)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
}

const selectAbility = (ability) => {
  const updated = CharacterService.addItem(selectedCharacter.value, 'abilities', {
    id: ability.id,
    collapsed: false, // Default to expanded
    showImprovements: false // Default to hiding improvements
  })
  if (updated) Object.assign(selectedCharacter.value, updated)
  toggleAbilitySelector()
}

const updateAbilityCollapsed = (ability, collapsed) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].collapsed = collapsed
  }
}

const updateAbilityShowImprovements = (ability, showImprovements) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].showImprovements = showImprovements
  }
}

</script>

<style scoped>
@import '@/styles/character-sheet-item-table.css';

@media (max-width: var(--breakpoint-sm)) {
  .ability-card {
    width: 90%;
  }
}
</style>
