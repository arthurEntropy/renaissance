<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" @create="createAbility" @load-more="loadMore">

    <!-- Item cards slot -->
    <template #item-cards="{ items }">
      <AbilityCard v-for="ability in items" :key="ability.id" :ability="ability" :editable="isAdmin" :sources="sources"
        :collapsible="false" :showImprovements="getAbilityShowImprovements(ability.id)" @delete="deleteAbility(ability)"
        @update="updateAbility(ability)" @edit="openEditAbilityModal(ability)"
        @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)"
        :showSuccesses="getAbilityShowSuccesses(ability.id)"
        @update:showSuccesses="updateAbilityShowSuccesses(ability.id, $event)" />
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
import { useEditModal } from '@/composables/useEditModal'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useInfiniteScrollObserver } from '@/composables/useInfiniteScrollObserver'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import AbilityService from '@/services/entities/abilityService'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

// Stores
const abilitiesStore = useAbilitiesStore()
const authStore = useAuthStore()
const sourcesStore = useSourcesStore()

const abilities = computed(() => abilitiesStore.abilities)

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
const improvementVisibility = ref(new Map())
const successesVisibility = ref(new Map())
const isLoadingMore = ref(false)

// Computed properties
const isAdmin = computed(() => authStore.isAdmin)
const sources = computed(() => sourcesStore.sources)

const sortOptions = ref({
  'Name': [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ],
  'MP': [
    { value: 'mp-asc', label: 'MP (Low to High)' },
    { value: 'mp-desc', label: 'MP (High to Low)' },
  ],
  'XP': [
    { value: 'xp-asc', label: 'XP (Low to High)' },
    { value: 'xp-desc', label: 'XP (High to Low)' },
  ],
})

// Filtered and sorted abilities (before pagination)
const allFilteredAbilities = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const sourceFilterValue = sourceFilter.value

  // Filter out deleted items
  let filtered = (abilities.value || []).filter((item) => !item.isDeleted)

  // Apply source filter
  if (sourceFilterValue) {
    filtered = filtered.filter((item) => item.source === sourceFilterValue)
  }

  // Apply search query
  if (query) {
    filtered = filtered.filter((item) => {
      const name = (item.name || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // Apply sorting
  if (sortOption.value) {
    const [field, direction] = sortOption.value.split('-')
    filtered.sort((a, b) => {
      const aValue = a?.[field]
      const bValue = b?.[field]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      let comparison = 0
      if (field === 'name') {
        comparison = String(aValue).localeCompare(String(bValue))
      } else {
        comparison = Number(aValue) - Number(bValue)
      }

      return direction === 'asc' ? comparison : -comparison
    })
  }

  return filtered
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
  sourceFilter
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
  const newAbility = await AbilityService.create()
  await abilitiesStore.fetch()
  const createdAbility = abilitiesStore.abilities.find(
    (ability) => ability.id === newAbility.id,
  )
  openEditAbilityModal(createdAbility)
}

const updateAbility = async (ability) => {
  await AbilityService.update(ability)
  await abilitiesStore.fetch()
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
      await AbilityService.update(abilityToUpdate)
      await abilitiesStore.fetch()
    } catch (error) {
      console.error('Error deleting ability:', error)
    }
  }
}

const saveEditedAbility = async (editedAbility) => {
  await AbilityService.update(editedAbility)
  closeEditAbilityModal()
  await abilitiesStore.fetch()
}

// Data initialization
const refreshData = async () => {
  try {
    await sourcesStore.fetchSources()
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
