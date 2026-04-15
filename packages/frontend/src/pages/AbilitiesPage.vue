<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" @create="createAbility" @load-more="loadMore">

    <!-- Additional filters slot for mana color filter -->
    <template #additional-filters>
      <MagicalFilter v-model="magicalFilter" />
      <AbilitySchoolFilter v-if="magicalFilter !== 'mundane'" v-model="schoolFilter" />
      <ManaColorFilter v-model="manaColorFilter" />
    </template>

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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useAuthStore } from '@/stores/authStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useActionTypesStore } from '@/stores/actionTypesStore'
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
import ManaColorFilter from '@/components/ui/mana/ManaColorFilter.vue'
import MagicalFilter from '@/components/ui/filters/MagicalFilter.vue'
import AbilitySchoolFilter from '@/components/ui/filters/AbilitySchoolFilter.vue'
import { getManaCostColors } from '@shared/utils/calculateManaCost'

// Stores
const abilitiesStore = useAbilitiesStore()
const authStore = useAuthStore()
const sourcesStore = useSourcesStore()
const actionTypesStore = useActionTypesStore()
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
const searchQuery = ref('')
const sourceFilter = ref('')
const manaColorFilter = ref([])
const improvementVisibility = ref(new Map())
const successesVisibility = ref(new Map())
const isLoadingMore = ref(false)

// Computed properties
const isAdmin = computed(() => authStore.isAdmin)
const sources = computed(() => sourcesStore.sources)

const sortOptions = computed(() => filterAdminSortOptions(ABILITY_SORT_OPTIONS, isAdmin.value))
const magicalFilter = ref('')
const schoolFilter = ref('')

// Filtered and sorted abilities (before pagination)
const allFilteredAbilities = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const sourceFilterValue = sourceFilter.value

  // Filter out deleted items
  let filtered = (abilities.value || []).filter((item) => !item.isDeleted)

  // Apply magical/mundane filter
  if (magicalFilter.value === 'magical') {
    filtered = filtered.filter((item) => item.isMagical)
  } else if (magicalFilter.value === 'mundane') {
    filtered = filtered.filter((item) => !item.isMagical)
  }

  // Apply school filter (only when not in mundane-only mode, since mundane abilities have no school)
  if (schoolFilter.value && magicalFilter.value !== 'mundane') {
    if (schoolFilter.value === '__none__') {
      filtered = filtered.filter((item) => !item.school)
    } else {
      filtered = filtered.filter((item) => item.school === schoolFilter.value)
    }
  }

  // Apply source filter
  if (sourceFilterValue) {
    if (sourceFilterValue.startsWith('type:')) {
      const sourceType = sourceFilterValue.slice(5)
      filtered = filtered.filter((item) => sourcesStore.getSourceType(item.source) === sourceType)
    } else {
      filtered = filtered.filter((item) => item.source === sourceFilterValue)
    }
  }

  // Apply search query
  if (query) {
    filtered = filtered.filter((item) => {
      const name = (item.name || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // Apply mana color filter
  if (manaColorFilter.value.length > 0) {
    filtered = filtered.filter((item) => {
      const colors = getManaCostColors(item.manaCost)
      // Check if the ability contains all selected colors
      return manaColorFilter.value.every(color => colors.has(color))
    })
  }

  return sortItems(filtered, sortOption.value)
})

// Infinite scroll setup - paginate the filtered results
const { paginatedItems: paginatedAbilities, loadMore: loadMoreItems, hasMore } = useInfiniteScroll(allFilteredAbilities, 50)

const loadMore = async () => {
  isLoadingMore.value = true
  loadMoreItems()
  await new Promise(resolve => setTimeout(resolve, 100))
  isLoadingMore.value = false
}

// Filter persistence - auto-initializes
useFilterPersistence('abilities', {
  sortOption,
  searchQuery,
  sourceFilter,
  manaColorFilter,
  magicalFilter,
  schoolFilter
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
  // Apply current source filter to new ability
  const initialData = {}
  if (sourceFilter.value) {
    initialData.source = sourceFilter.value
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
  sortOptions: sortOptions.value,
  hasMore: hasMore.value,
  isLoadingMore: isLoadingMore.value,
  showSourceGroupOptions: true,
}))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

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
