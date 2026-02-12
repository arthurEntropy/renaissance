<template>
  <CharacterSheetSection>

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="internalEditMode" :show-edit-button="canEdit" collapsible
      :is-collapsed="isCollapsed" @toggle-collapse="isCollapsed = !isCollapsed" @toggle-edit="toggleEditMode">
      <template #header-left>
        <FloatingActionButton v-if="internalEditMode" type="add" size="small" visibility="always"
          @click="toggleAbilitySelector" />
      </template>
      <template #header-center>
        <div v-show="!isCollapsed && internalEditMode" class="header-controls">
          <SortingDropdown v-model="groupingOption" :options="groupingOptions" placeholder="Group by..." />
          <SortingDropdown v-model="abilitySortOption" :options="sortOptions" placeholder="Order by..." />
        </div>
      </template>
      <template #header-right>
        <MPDisplay :is-edit-mode="canEdit" />
      </template>
    </TableHeader>

    <div v-if="!isCollapsed">
      <!-- Empty State: No Abilities -->
      <div v-if="characterAbilities.length === 0" class="empty-table-state">
        <p class="empty-table-message">No abilities yet</p>
        <p v-if="internalEditMode" class="empty-table-hint">Click the + button above to add your first ability</p>
      </div>

      <!-- Grouped Display -->
      <GroupedMasonryGrid v-else-if="hasAbilityGrouping" :column-width="350" :gap="20" :row-height="10"
        :grouped-items="groupedAbilities" class="abilities-masonry" ref="masonryGridRef">
        <template #default="{ item }">
          <AbilityCard v-if="item" :ability="item" :collapsed="item.collapsed" class="ability-card" :collapsible="false"
            :show-xp-badge="true" :show-add-to-character="false" :show-action-buttons="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="item.showImprovements"
            @update:showImprovements="updateAbilityShowImprovements(item, $event)" :show-successes="item.showSuccesses"
            @update:showSuccesses="updateAbilityShowSuccesses(item, $event)" :deletable="internalEditMode"
            @delete="removeAbilityById(item.id)" />
          <span v-else class="missing-item">Unknown ability</span>
        </template>
      </GroupedMasonryGrid>

      <!-- Ungrouped Display -->
      <MasonryGrid v-else :column-width="350" :gap="20" :row-height="10" class="abilities-masonry" ref="masonryGridRef">
        <div v-for="ability in characterAbilities" :key="ability.id" class="masonry-item">
          <AbilityCard v-if="ability" :ability="ability" :collapsed="ability.collapsed" class="ability-card"
            :collapsible="false" :show-xp-badge="true" :show-add-to-character="false" :show-action-buttons="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="ability.showImprovements"
            @update:showImprovements="updateAbilityShowImprovements(ability, $event)"
            :show-successes="ability.showSuccesses" @update:showSuccesses="updateAbilityShowSuccesses(ability, $event)"
            :deletable="internalEditMode" @delete="removeAbilityById(ability.id)" />
          <span v-else class="missing-item">Unknown ability</span>
        </div>
      </MasonryGrid>
    </div>

    <!-- Add Ability Selector Modal -->
    <ItemSelector :show="showAbilitySelector" title="Add Ability" :grouped-items="groupedAbilitiesForSelector"
      :search-query="abilitySearchQuery" search-placeholder="Search abilities..." no-items-message="No abilities found"
      :get-source-name="sourcesStore.getSourceName" @close="toggleAbilitySelector" @select="selectAbility"
      @search="abilitySearchQuery = $event" />

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import MPDisplay from './MPDisplay.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import SortingDropdown from '@/components/ui/dropdowns/SortingDropdown.vue'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useItemGrouping } from '@/composables/useItemGrouping'
import { sortItems } from '@/utils/sortItems'
import { ABILITY_SORT_OPTIONS } from '@/constants/sortOptions'
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

const masonryGridRef = ref(null)

const sortOptions = ABILITY_SORT_OPTIONS

const groupingOptions = [
  { value: 'source', label: 'Source' }
]

// Grouping and Sorting state
const groupingOption = computed({
  get: () => selectedCharacter.value?.groupAbilitiesBySource ? 'source' : '',
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.groupAbilitiesBySource = (value === 'source')
    }
  }
})

const abilitySortOption = computed({
  get: () => selectedCharacter.value?.abilitySortOption || 'name-asc',
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.abilitySortOption = value
    }
  }
})

const internalEditMode = ref(false)
const isCollapsed = ref(false)

const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const canEdit = computed(() => props.canEdit)

const sourcesStore = useSourcesStore()

const characterAbilities = computed(() => {
  const allAbilitiesArray = allAbilities.value || []
  if (!selectedCharacter.value?.abilities) return []

  const abilities = selectedCharacter.value.abilities
    ?.map((abilityObj) => {
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
        showSuccesses: abilityObj.showSuccesses ?? false
      }
    })
    .filter((ability) => ability !== null) || []

  return sortItems(abilities, abilitySortOption.value)
})

const {
  showSelector: showAbilitySelector,
  searchQuery: abilitySearchQuery,
  groupedItems: groupedAbilitiesForSelector,
  toggleSelector: toggleAbilitySelector
} = useItemSelector(
  allAbilities,
  sourcesStore,
  { searchFields: ['name'] }
)

const { groupedItems: groupedAbilities, hasGrouping: hasAbilityGrouping } = useItemGrouping(
  characterAbilities,
  computed(() => !!selectedCharacter.value?.groupAbilitiesBySource),
  sourcesStore
)

watch(characterAbilities, () => {
  masonryGridRef.value?.updateLayout()
}, { deep: true })

const removeAbilityById = (abilityId) => {
  if (!internalEditMode.value || !selectedCharacter.value?.abilities) return

  const index = selectedCharacter.value.abilities.findIndex(a => a.id === abilityId)
  if (index === -1) return

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
    showImprovements: false, // Default to hiding improvements
    showSuccesses: false // Default to hiding successes
  })
  if (updated) Object.assign(selectedCharacter.value, updated)
  toggleAbilitySelector()
}

const updateAbilityShowImprovements = (ability, showImprovements) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].showImprovements = showImprovements
  }
}

const updateAbilityShowSuccesses = (ability, showSuccesses) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].showSuccesses = showSuccesses
  }
}

onMounted(() => {
  masonryGridRef.value?.updateLayout()
})

</script>

<style scoped>
.missing-item {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.empty-table-state {
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  background: var(--color-bg-secondary);
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

@media (max-width: var(--breakpoint-sm)) {
  .ability-card {
    width: 90%;
  }
}
</style>
