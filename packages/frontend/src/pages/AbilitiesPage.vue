<template>
  <!-- Flat/Ungrouped view using ItemCardsLayout -->
  <ItemCardsLayout v-if="!groupByOption" v-model:searchQuery="searchQuery" v-model:tagFilters="abilityTagFilters"
    v-model:groupBy="groupByOption" v-model:sortOption="sortOption" v-bind="layoutProps" @create="createAbility"
    @load-more="loadMore">

    <!-- Item cards slot -->
    <template #item-cards="{ items }">
      <AbilityCard v-for="ability in items" :key="ability.id" :ability="ability" :editable="isAdmin" :sources="sources"
        :collapsible="false" :showImprovements="getAbilityShowImprovements(ability.id)" @delete="deleteAbility(ability)"
        @update="handleUpdate" @edit="openEditAbilityModal(ability)"
        @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)"
        :showSuccesses="getAbilityShowSuccesses(ability.id)"
        @update:showSuccesses="updateAbilityShowSuccesses(ability.id, $event)" :character="selectedCharacter"
        :show-improvement-toggle="!!selectedCharacter" />
    </template>

    <!-- Loading indicator slot with ref for intersection observer -->
    <template #loading-indicator="{ hasMore, isLoadingMore }">
      <div v-if="hasMore" class="loading-indicator" ref="loadingIndicatorRef">
        <span v-if="isLoadingMore" class="loading-text">Loading more items...</span>
      </div>
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" :sources="sources"
        @update="saveEditedAbility" @close="closeEditAbilityModal" @delete="deleteAbility(abilityToEdit)" />
    </template>

  </ItemCardsLayout>

  <!-- Grouped view -->
  <div v-else class="abilities-page">
    <!-- Filter Bar -->
    <FilterBar v-model:searchQuery="searchQuery" v-model:selectedTags="abilityTagFilters"
      v-model:groupBy="groupByOption" v-model:orderBy="sortOption" :tag-groups="abilityTagGroups"
      :tag-picker-mode="'cascade'" :multiselect="true" :group-options="groupByOptions" :order-options="sortOptions"
      :show-add-button="isAdmin" search-placeholder="Search abilities..." :tag-search-placeholder="'Filter by tags...'"
      :stats="stats" @add="createAbility">
    </FilterBar>

    <!-- School Grouped view -->
    <GroupedMasonryGrid v-if="groupByOption === 'school'" :column-width="350" :gap="20" :row-height="10"
      justify-content="start" :grouped-items="schoolGroupedAbilities" :persistence-key="`abilities-school-groups`"
      class="cards-container">
      <template #default="{ item }">
        <AbilityCard :ability="item" :editable="isAdmin" :sources="sources" :collapsible="false"
          :showImprovements="getAbilityShowImprovements(item.id)"
          @update:showImprovements="updateAbilityShowImprovements(item.id, $event)" @edit="openEditAbilityModal(item)"
          :character="selectedCharacter" :show-improvement-toggle="!!selectedCharacter"
          :showSuccesses="getAbilityShowSuccesses(item.id)"
          @update:showSuccesses="updateAbilityShowSuccesses(item.id, $event)" @update="handleUpdate"
          @delete="deleteAbility(item)" />
      </template>
    </GroupedMasonryGrid>

    <!-- Mana Color Grouped view -->
    <GroupedMasonryGrid v-else-if="groupByOption === 'mana-color'" :column-width="350" :gap="20" :row-height="10"
      justify-content="start" :grouped-items="manaColorGroupedAbilities"
      :persistence-key="`abilities-mana-color-groups`" class="cards-container">
      <template #default="{ item }">
        <AbilityCard :ability="item" :editable="isAdmin" :sources="sources" :collapsible="false"
          :showImprovements="getAbilityShowImprovements(item.id)"
          @update:showImprovements="updateAbilityShowImprovements(item.id, $event)" @edit="openEditAbilityModal(item)"
          :character="selectedCharacter" :show-improvement-toggle="!!selectedCharacter"
          :showSuccesses="getAbilityShowSuccesses(item.id)"
          @update:showSuccesses="updateAbilityShowSuccesses(item.id, $event)" @update="handleUpdate"
          @delete="deleteAbility(item)" />
      </template>
    </GroupedMasonryGrid>

    <!-- Source Grouped view -->
    <GroupedMasonryGrid v-else-if="groupByOption === 'source'" :column-width="350" :gap="20" :row-height="10"
      justify-content="start" :grouped-items="sourceGroupedAbilities" :persistence-key="`abilities-source-groups`"
      class="cards-container">
      <template #default="{ item }">
        <AbilityCard :ability="item" :editable="isAdmin" :sources="sources" :collapsible="false"
          :showImprovements="getAbilityShowImprovements(item.id)"
          @update:showImprovements="updateAbilityShowImprovements(item.id, $event)" @edit="openEditAbilityModal(item)"
          :character="selectedCharacter" :show-improvement-toggle="!!selectedCharacter"
          :showSuccesses="getAbilityShowSuccesses(item.id)"
          @update:showSuccesses="updateAbilityShowSuccesses(item.id, $event)" @update="handleUpdate"
          @delete="deleteAbility(item)" />
      </template>
    </GroupedMasonryGrid>

    <!-- Action Type Grouped view -->
    <GroupedMasonryGrid v-else-if="groupByOption === 'action-type'" :column-width="350" :gap="20" :row-height="10"
      justify-content="start" :grouped-items="actionTypeGroupedAbilities"
      :persistence-key="`abilities-action-type-groups`" class="cards-container">
      <template #default="{ item }">
        <AbilityCard :ability="item" :editable="isAdmin" :sources="sources" :collapsible="false"
          :showImprovements="getAbilityShowImprovements(item.id)"
          @update:showImprovements="updateAbilityShowImprovements(item.id, $event)" @edit="openEditAbilityModal(item)"
          :character="selectedCharacter" :show-improvement-toggle="!!selectedCharacter"
          :showSuccesses="getAbilityShowSuccesses(item.id)"
          @update:showSuccesses="updateAbilityShowSuccesses(item.id, $event)" @update="handleUpdate"
          @delete="deleteAbility(item)" />
      </template>
    </GroupedMasonryGrid>

    <!-- Modals -->
    <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" :sources="sources"
      @update="saveEditedAbility" @close="closeEditAbilityModal" @delete="deleteAbility(abilityToEdit)" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useAuthStore } from '@/stores/authStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useActionCostsStore } from '@/stores/actionCostsStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useEditModal } from '@/composables/useEditModal'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useInfiniteScrollObserver } from '@/composables/useInfiniteScrollObserver'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { sortItems } from '@/utils/sortItems'
import { ABILITY_SORT_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import { getManaCostColors } from '@shared/utils/calculateManaCost'
import { SOURCE_COLLECTION_TYPES } from '@/constants/sourceTypes'
import { ManaColor, MANA_COLOR_ORDER } from '@shared/constants/manaColors'
import { FILTER_TAG_PREFIXES } from '@/constants/filterTagPrefixes'
import { FILTER_SPECIAL_TAG_GROUP_LABEL } from '@/constants/filterBar'

// Stores
const abilitiesStore = useAbilitiesStore()
const authStore = useAuthStore()
const sourcesStore = useSourcesStore()
const actionTypesStore = useActionCostsStore()
const charactersStore = useCharactersStore()
const abilitySchoolsStore = useAbilitySchoolsStore()

const abilities = computed(() => abilitiesStore.abilities)
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

// Modal management
const {
  showModal: showEditAbilityModal,
  itemToEdit: abilityToEdit,
  openModal: openEditAbilityModal,
  closeModal: closeEditAbilityModal
} = useEditModal()

// Reactive state
const sortOption = ref('')
const groupByOption = ref('')
const searchQuery = ref('')
const abilityTagFilters = ref([])
const improvementVisibility = ref(new Map())
const successesVisibility = ref(new Map())
const isLoadingMore = ref(false)

// Computed properties
const isAdmin = computed(() => authStore.isAdmin)
const sources = computed(() => sourcesStore.sources)
const abilitySchools = computed(() => abilitySchoolsStore.items || [])

const sortOptions = computed(() => filterAdminSortOptions(ABILITY_SORT_OPTIONS, isAdmin.value))
const groupByOptions = [
  { value: 'school', label: 'School' },
  { value: 'mana-color', label: 'Mana Color' },
  { value: 'source', label: 'Source' },
  { value: 'action-type', label: 'Action Cost' },
]

const TAG_PREFIX = {
  ...FILTER_TAG_PREFIXES,
  SCHOOL: 'school:',
  MANA_COLOR: 'mana-color:',
  ACTION_TYPE: 'action-type:',
}

const abilityTagGroups = computed(() => {
  const sourceTypeOrder = ['ancestry', 'culture', 'mestiere', 'worldElement']
  const sourceTypeById = SOURCE_COLLECTION_TYPES.reduce((acc, typeDef) => {
    acc[typeDef.id] = typeDef
    return acc
  }, {})

  const groups = sourceTypeOrder
    .map((sourceTypeId) => {
      const sourceType = sourceTypeById[sourceTypeId]
      if (!sourceType) return null
      const items = sourcesStore.sources[sourceType.listKey] || []
      if (!items.length) return null
      return {
        label: sourceType.label,
        items: [
          { id: `${TAG_PREFIX.SOURCE_TYPE}${sourceType.id}`, name: `All ${sourceType.label}` },
          ...items.map((source) => ({ id: `${TAG_PREFIX.SOURCE}${source.id}`, name: source.name })),
        ],
      }
    })
    .filter(Boolean)

  const schoolItems = [{ id: `${TAG_PREFIX.SCHOOL}__none__`, name: 'No School' }]
  for (const school of abilitySchools.value) {
    const sourceName = sourcesStore.getSourceName(school.sourceId)
    schoolItems.push({ id: `${TAG_PREFIX.SCHOOL}${school.id}`, name: `${school.name} (${sourceName})` })
  }
  groups.push({ label: 'Mestiere Schools', items: schoolItems })

  groups.push({
    label: FILTER_SPECIAL_TAG_GROUP_LABEL,
    items: [
      { id: `${TAG_PREFIX.MAGIC}magical`, name: 'Magical' },
      { id: `${TAG_PREFIX.MAGIC}mundane`, name: 'Mundane' },
      {
        id: `${TAG_PREFIX.MANA_COLOR}mana`,
        name: 'Mana Color',
        items: MANA_COLOR_ORDER.map((color) => ({
          id: `${TAG_PREFIX.MANA_COLOR}${color}`,
          name: color.charAt(0).toUpperCase() + color.slice(1),
        })),
      },
      {
        id: `${TAG_PREFIX.ACTION_TYPE}action`,
        name: 'Action Cost',
        items: (actionTypesStore.items || []).map((actionType) => ({
          id: `${TAG_PREFIX.ACTION_TYPE}${actionType.id}`,
          name: actionType.name,
        })),
      },
    ],
  })

  return groups
})

const MANA_GROUP_ORDER = ['none', ...MANA_COLOR_ORDER.filter(color => color !== ManaColor.COLORLESS), ManaColor.MULTICOLOR, ManaColor.COLORLESS]

const getManaColorGroupKey = (ability) => {
  if (!ability.manaCost) {
    return 'none'
  }

  const colors = getManaCostColors(ability.manaCost)
  if (colors.size === 0) return ManaColor.COLORLESS
  if (colors.size === 1) return [...colors][0]
  return ManaColor.MULTICOLOR
}

const compareAbilityGroups = (left, right) => {
  if (groupByOption.value === 'school') {
    const leftSchool = left.school ? (abilitySchoolsStore.getById(left.school)?.name || 'Unknown School') : 'No School'
    const rightSchool = right.school ? (abilitySchoolsStore.getById(right.school)?.name || 'Unknown School') : 'No School'
    return leftSchool.localeCompare(rightSchool)
  }

  if (groupByOption.value === 'mana-color') {
    const leftRank = MANA_GROUP_ORDER.indexOf(getManaColorGroupKey(left))
    const rightRank = MANA_GROUP_ORDER.indexOf(getManaColorGroupKey(right))
    const safeLeftRank = leftRank === -1 ? 999 : leftRank
    const safeRightRank = rightRank === -1 ? 999 : rightRank
    return safeLeftRank - safeRightRank
  }

  if (groupByOption.value === 'source') {
    const leftSourceName = sourcesStore.getSourceName(left.source) || 'Unknown Source'
    const rightSourceName = sourcesStore.getSourceName(right.source) || 'Unknown Source'
    return leftSourceName.localeCompare(rightSourceName)
  }

  if (groupByOption.value === 'action-type') {
    const leftActionType = actionTypesStore.getById(left.actionCost)?.name || 'Unknown Action Cost'
    const rightActionType = actionTypesStore.getById(right.actionCost)?.name || 'Unknown Action Cost'
    return leftActionType.localeCompare(rightActionType)
  }

  return 0
}

const parsedTagFilters = computed(() => {
  const tags = Array.isArray(abilityTagFilters.value) ? abilityTagFilters.value : []
  return {
    sourceIds: tags
      .filter((tag) => tag.startsWith(TAG_PREFIX.SOURCE))
      .map((tag) => tag.slice(TAG_PREFIX.SOURCE.length)),
    sourceTypes: tags
      .filter((tag) => tag.startsWith(TAG_PREFIX.SOURCE_TYPE))
      .map((tag) => tag.slice(TAG_PREFIX.SOURCE_TYPE.length)),
    magicality: tags
      .filter((tag) => tag.startsWith(TAG_PREFIX.MAGIC))
      .map((tag) => tag.slice(TAG_PREFIX.MAGIC.length)),
    schoolFilters: tags
      .filter((tag) => tag.startsWith(TAG_PREFIX.SCHOOL))
      .map((tag) => tag.slice(TAG_PREFIX.SCHOOL.length)),
    manaColors: tags
      .filter((tag) => tag.startsWith(TAG_PREFIX.MANA_COLOR))
      .map((tag) => tag.slice(TAG_PREFIX.MANA_COLOR.length)),
    actionTypes: tags
      .filter((tag) => tag.startsWith(TAG_PREFIX.ACTION_TYPE))
      .map((tag) => tag.slice(TAG_PREFIX.ACTION_TYPE.length)),
  }
})

// Filtered and sorted abilities (before pagination)
const allFilteredAbilities = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const { sourceIds, sourceTypes, magicality, schoolFilters, manaColors, actionTypes } = parsedTagFilters.value

  // Filter out deleted items
  let filtered = (abilities.value || []).filter((item) => !item.isDeleted)

  // Campaign mode: restrict to abilities from included concept sources
  const campaignStore = useCampaignStore()
  if (campaignStore.isInCampaign && campaignStore.activeIncludedConceptIds?.length > 0) {
    const included = new Set(campaignStore.activeIncludedConceptIds)
    filtered = filtered.filter(
      (item) => !item.source || item.source === 'general' || included.has(item.source)
    )
  }

  // Apply source filters (OR within category)
  if (sourceIds.length > 0) {
    filtered = filtered.filter((item) => sourceIds.includes(item.source))
  }

  // Apply source-type filters (OR within category)
  if (sourceTypes.length > 0) {
    filtered = filtered.filter((item) => sourceTypes.includes(sourcesStore.getSourceType(item.source)))
  }

  // Apply magicality filter (OR within category)
  const hasMagicalTag = magicality.includes('magical')
  const hasMundaneTag = magicality.includes('mundane')
  if (hasMagicalTag !== hasMundaneTag) {
    filtered = filtered.filter((item) => (hasMagicalTag ? item.isMagical : !item.isMagical))
  }

  // Mundane-only mode has no school dimension.
  const shouldApplySchoolFilters = !(hasMundaneTag && !hasMagicalTag)

  // Apply school filters (OR within category)
  if (schoolFilters.length > 0 && shouldApplySchoolFilters) {
    const includesNoSchool = schoolFilters.includes('__none__')
    const schoolIds = schoolFilters.filter((schoolId) => schoolId !== '__none__')
    filtered = filtered.filter((item) => {
      const matchesNoSchool = includesNoSchool && !item.school
      const matchesSchool = item.school && schoolIds.includes(item.school)
      return matchesNoSchool || matchesSchool
    })
  }

  // Apply search query
  if (query) {
    filtered = filtered.filter((item) => {
      const name = (item.name || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // Apply mana color filter (AND within category - ability must contain all selected colors)
  if (manaColors.length > 0) {
    filtered = filtered.filter((item) => {
      const colors = getManaCostColors(item.manaCost)
      return manaColors.every(color => colors.has(color))
    })
  }

  // Apply action type filter (OR within category)
  if (actionTypes.length > 0) {
    filtered = filtered.filter((item) => actionTypes.includes(item.actionCost))
  }

  const sorted = sortItems(filtered, sortOption.value)
  if (!groupByOption.value) {
    return sorted
  }

  return [...sorted].sort((left, right) => {
    const groupCompare = compareAbilityGroups(left, right)
    if (groupCompare !== 0) return groupCompare
    return 0
  })
})

// Infinite scroll setup - paginate the filtered results
const { paginatedItems: paginatedAbilities, loadMore: loadMoreItems, hasMore } = useInfiniteScroll(allFilteredAbilities, 50)

const loadMore = async () => {
  isLoadingMore.value = true
  loadMoreItems()
  await new Promise(resolve => setTimeout(resolve, 100))
  isLoadingMore.value = false
}

// Grouped abilities by school
const schoolGroupedAbilities = computed(() => {
  if (groupByOption.value !== 'school') return []
  const groups = {}
  allFilteredAbilities.value.filter(a => a.school).forEach(ability => {
    const school = abilitySchoolsStore.getById(ability.school)
    const schoolName = school?.name || 'Unknown School'
    if (!groups[ability.school]) {
      groups[ability.school] = { id: ability.school, name: schoolName, collapsed: false, items: [] }
    }
    groups[ability.school].items.push(ability)
  })

  // Add abilities with no school first
  const noSchoolAbilities = allFilteredAbilities.value.filter(a => !a.school)
  if (noSchoolAbilities.length > 0) {
    Object.entries(groups).length > 0
      ? (groups['__no-school__'] = { id: '__no-school__', name: 'No School', collapsed: false, items: noSchoolAbilities })
      : (groups['__no-school__'] = { id: '__no-school__', name: 'No School', collapsed: false, items: noSchoolAbilities })
  }

  const result = Object.values(groups).sort((a, b) => {
    if (a.id === '__no-school__') return 1
    if (b.id === '__no-school__') return -1
    return a.name.localeCompare(b.name)
  })

  return result
})

// Grouped abilities by mana color
const MANA_COLOR_GROUP_ORDER = ['none', ...MANA_COLOR_ORDER.filter(c => c !== ManaColor.COLORLESS), ManaColor.MULTICOLOR, ManaColor.COLORLESS]
const MANA_COLOR_GROUP_LABELS = {
  [ManaColor.WHITE]: 'White',
  [ManaColor.BLUE]: 'Blue',
  [ManaColor.BLACK]: 'Black',
  [ManaColor.RED]: 'Red',
  [ManaColor.GREEN]: 'Green',
  [ManaColor.COLORLESS]: 'Colorless',
  [ManaColor.MULTICOLOR]: 'Multicolor',
  none: 'No Mana Cost',
}

const manaColorGroupedAbilities = computed(() => {
  if (groupByOption.value !== 'mana-color') return []
  const groups = {}
  allFilteredAbilities.value.forEach(ability => {
    let key
    if (!ability.manaCost) {
      key = 'none'
    } else {
      const colors = getManaCostColors(ability.manaCost)
      if (colors.size === 0) key = ManaColor.COLORLESS
      else if (colors.size === 1) key = [...colors][0]
      else key = ManaColor.MULTICOLOR
    }
    if (!groups[key]) {
      groups[key] = { id: key, name: MANA_COLOR_GROUP_LABELS[key] || key, collapsed: false, items: [] }
    }
    groups[key].items.push(ability)
  })
  return Object.values(groups).sort((a, b) => {
    const ai = MANA_COLOR_GROUP_ORDER.indexOf(a.id)
    const bi = MANA_COLOR_GROUP_ORDER.indexOf(b.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})

// Grouped abilities by source
const sourceGroupedAbilities = computed(() => {
  if (groupByOption.value !== 'source') return []
  const groups = {}
  allFilteredAbilities.value.forEach(ability => {
    const sourceId = ability.source
    const sourceName = sourcesStore.getSourceName(sourceId) || 'Unknown Source'
    if (!groups[sourceId]) {
      groups[sourceId] = { id: sourceId, name: sourceName, collapsed: false, items: [] }
    }
    groups[sourceId].items.push(ability)
  })
  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

// Grouped abilities by action cost
const actionTypeGroupedAbilities = computed(() => {
  if (groupByOption.value !== 'action-type') return []
  const groups = {}
  allFilteredAbilities.value.forEach(ability => {
    const actionTypeId = ability.actionCost
    const actionTypeName = actionTypesStore.getById(actionTypeId)?.name || 'Unknown Action Cost'
    if (!groups[actionTypeId]) {
      groups[actionTypeId] = { id: actionTypeId, name: actionTypeName, collapsed: false, items: [] }
    }
    groups[actionTypeId].items.push(ability)
  })
  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

// Statistics
const stats = computed(() => [
  { label: 'Total', value: allFilteredAbilities.value.length },
])

// Filter persistence - auto-initializes
useFilterPersistence('abilities', {
  sortOption,
  groupByOption,
  searchQuery,
  abilityTagFilters,
})

// Improvement visibility methods
const getAbilityShowImprovements = (abilityId) => {
  return improvementVisibility.value.get(abilityId) || false
}

const updateAbilityShowImprovements = (abilityId, showImprovements) => {
  improvementVisibility.value.set(abilityId, showImprovements)
}

// Successes visibility methods
const getAbilityShowSuccesses = (abilityId) => {
  return successesVisibility.value.get(abilityId) || false
}

const updateAbilityShowSuccesses = (abilityId, showSuccesses) => {
  successesVisibility.value.set(abilityId, showSuccesses)
}

// CRUD operations
const createAbility = async () => {
  // Apply current source-tag filter to new ability when exactly one source is selected.
  const initialData = {}
  const selectedSourceTags = (abilityTagFilters.value || [])
    .filter((tag) => tag.startsWith(TAG_PREFIX.SOURCE))
    .map((tag) => tag.slice(TAG_PREFIX.SOURCE.length))

  if (selectedSourceTags.length === 1) {
    initialData.source = selectedSourceTags[0]
  }

  const newAbility = await abilitiesStore.create(initialData)
  openEditAbilityModal(newAbility)
}

const handleUpdate = async (data) => {
  // Handle both ability updates (from toggleActive) and character updates (from improvement toggles)
  if (data.abilities || data.equipment) {
    // This is a character update
    await charactersStore.update(data)
  } else {
    // This is an ability update
    await abilitiesStore.update(data)
  }
}

const deleteAbility = async (ability) => {
  const deleteId = ability?.id
  const editId = abilityToEdit.value?.id
  if (ability) {
    const abilityToUpdate = { ...ability, isDeleted: true }
    try {
      if (showEditAbilityModal.value && editId === deleteId) {
        closeEditAbilityModal()
      }
      await abilitiesStore.update(abilityToUpdate)
    } catch (error) {
      console.error('Error deleting ability:', error)
    }
  }
}

const saveEditedAbility = async (editedAbility) => {
  await abilitiesStore.update(editedAbility)
  closeEditAbilityModal()
}

// Data initialization
const refreshData = async () => {
  try {
    await actionTypesStore.fetch()
    await sourcesStore.fetchSources()
    await abilitySchoolsStore.fetch() // Pre-load schools for BaseCard badge rendering
    await abilitiesStore.fetch()
  } catch (error) {
    console.error('Error initializing AbilitiesPage:', error)
  }
}

// Setup infinite scroll observer
const { observerRef: loadingIndicatorRef, setup: setupObserver } = useInfiniteScrollObserver(
  loadMore,
  hasMore
)

onMounted(() => {
  refreshData()
  setupObserver()
})

// Layout props for ItemCardsLayout
const layoutProps = computed(() => ({
  items: paginatedAbilities.value,
  groupOptions: groupByOptions,
  sortOptions: sortOptions.value,
  hasMore: hasMore.value,
  isLoadingMore: isLoadingMore.value,
  tagGroups: abilityTagGroups.value,
  tagPickerMode: 'cascade',
  tagMultiselect: true,
  tagSearchPlaceholder: 'Filter by tags...',
  stats: stats.value,
}))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.abilities-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 1460px;
  margin: 0 auto;
  gap: var(--space-lg);
}

.cards-container {
  width: 100%;
}

.loading-indicator {
  padding: var(--space-lg);
  text-align: center;
  width: 100%;
}

.loading-text {
  color: var(--color-gray-light);
  font-size: var(--font-size-14);
  font-style: italic;
}
</style>
