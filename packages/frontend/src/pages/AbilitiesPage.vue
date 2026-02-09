<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" @create="createAbility" @load-more="loadMore">

    <!-- Additional filters slot for mana color filter -->
    <template #additional-filters>
      <ManaColorFilter v-model="manaColorFilter" />
    </template>

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
import ManaColorFilter from '@/components/ui/mana/ManaColorFilter.vue'
import { calculateTotalManaCost, getManaCostColors } from '@shared/utils/calculateManaCost'

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
const manaColorFilter = ref([])
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
  'Mana Cost': [
    { value: 'manaCost-asc', label: 'Mana Cost (Low to High)' },
    { value: 'manaCost-desc', label: 'Mana Cost (High to Low)' },
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

  // Apply mana color filter
  if (manaColorFilter.value.length > 0) {
    filtered = filtered.filter((item) => {
      const colors = getManaCostColors(item.manaCost)
      // Check if the ability contains all selected colors
      return manaColorFilter.value.every(color => colors.has(color))
    })
  }

  // Apply sorting
  if (sortOption.value) {
    const [field, direction] = sortOption.value.split('-')
    filtered.sort((a, b) => {
      let comparison = 0

      if (field === 'name') {
        const aValue = a?.[field]
        const bValue = b?.[field]
        // Handle null/undefined values for name
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1
        comparison = String(aValue).localeCompare(String(bValue))
      } else if (field === 'manaCost') {
        // Calculate total mana cost
        const aCost = calculateTotalManaCost(a?.manaCost)
        const bCost = calculateTotalManaCost(b?.manaCost)
        comparison = aCost - bCost
      } else {
        const aValue = a?.[field]
        const bValue = b?.[field]
        // For numeric fields (MP, XP), treat null/undefined as 0
        const aNum = aValue == null ? 0 : Number(aValue)
        const bNum = bValue == null ? 0 : Number(bValue)
        comparison = aNum - bNum
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
  sourceFilter,
  manaColorFilter
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
  openEditAbilityModal(newAbility)
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
  await abilitiesStore.fetch(true)
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
