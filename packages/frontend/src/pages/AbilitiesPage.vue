<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" ref="layoutRef">

    <!-- Item cards slot -->
    <template #item-cards="{ filteredItems }">
      <AbilityCard v-for="ability in filteredItems" :key="ability.id" :ability="ability" :editable="isAdmin"
        :sources="sources" @delete="deleteAbility(ability)" @update="updateAbility(ability)"
        @edit="openEditAbilityModal(ability)" @height-changed="layoutRef?.onCardHeightChanged()" :collapsible="false"
        :improvements="ability.improvements || []" :showImprovements="getAbilityShowImprovements(ability.id)"
        @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)" />
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
import { storeToRefs } from 'pinia'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useAuthStore } from '@/stores/authStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useEditModal } from '@/composables/useEditModal'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import AbilityService from '@/services/entities/abilityService'
import AbilityCard from '@/components/ui/cards/AbilityCard.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

// Stores
const abilitiesStore = useAbilitiesStore()
const authStore = useAuthStore()
const sourcesStore = useSourcesStore()

const { abilities } = storeToRefs(abilitiesStore)

// Modal management
const {
  showModal: showEditAbilityModal,
  itemToEdit: abilityToEdit,
  openModal: openEditAbilityModal,
  closeModal: closeEditAbilityModal
} = useEditModal()

// Reactive state
const layoutRef = ref(null)
const sortOption = ref('')
const searchQuery = ref('')
const sourceFilter = ref('')
const improvementVisibility = ref(new Map())

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

// Infinite scroll setup
const { paginatedItems: paginatedAbilities, loadMore, hasMore } = useInfiniteScroll(abilities, 50)

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

onMounted(() => {
  refreshData()
})

// Layout props for ItemCardsLayout
const layoutProps = computed(() => ({
  itemType: 'Ability',
  itemTypePlural: 'Abilities',
  sources: sources.value,
  items: paginatedAbilities.value,
  sortOptions: sortOptions.value,
  hasMore: hasMore.value,
  onCreate: createAbility,
  onLoadMore: loadMore
}))
</script>
