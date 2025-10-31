<template>
  <div class="concepts-view">
    <!-- Filter Controls (conditionally shown) -->
    <FilterControls v-if="showFilters" v-model:search-query="searchQuery" v-model:primary-filter="expansionFilter"
      :search-placeholder="`Search ${itemNamePlural}...`" :primary-filter-options="expansionFilterOptions"
      primary-filter-label="All Expansions" />

    <!-- Selection Cards -->
    <div class="concepts-container">
      <ConceptCard v-for="concept in filteredConcepts" :key="concept.id" :concept="concept" :sources="sources"
        @select="openConceptDetail" />
      <AddConceptCard v-if="isAdmin" :concept-name="itemName" @click="createConcept" />
    </div>

    <!-- Modal with Navigation Controls -->
    <NavigationControls v-if="showConceptDetail" :has-previous="hasPreviousConcept" :has-next="hasNextConcept"
      @navigate="navigateConcept">

      <!-- Character Sheet Modal -->
      <CharacterSheetModal v-if="modalComponent === 'CharacterSheetModal'" :key="`character-${conceptDetailKey}`"
        v-bind="customModalProps" @close="closeConceptDetail" @update:character="updateConcept"
        @delete:character="deleteConcept" />

      <!-- Concept Detail Modal -->
      <ConceptDetail v-else :key="`concept-${conceptDetailKey}`" :concept="selectedConcept" :editable="isAdmin"
        @close="closeConceptDetail" @update="updateConcept" />
    </NavigationControls>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAuthStore } from '@/stores/authStore'
import ConceptCard from '@/components/ui/cards/ConceptCard.vue'
import AddConceptCard from '@/components/ui/cards/AddConceptCard.vue'
import FilterControls from '@/components/ui/FilterControls.vue'
import NavigationControls from '@/components/ui/NavigationControls.vue'
import ConceptDetail from '@/components/features/conceptDetail/ConceptDetail.vue'
import CharacterSheetModal from '@/components/features/characterSheet/CharacterSheet.vue'

// Props
const props = defineProps({
  itemName: {
    type: String,
    required: true,
  },
  concepts: {
    type: Array,
    default: () => [],
  },
  createConceptFn: {
    type: Function,
    required: true,
  },
  updateConceptFn: {
    type: Function,
    required: true,
  },
  deleteConceptFn: {
    type: Function,
    required: true,
  },
  refreshDataFn: {
    type: Function,
    required: true,
  },
  showFilters: {
    type: Boolean,
    default: true,
  },
  modalComponent: {
    type: String,
    default: 'ConceptDetail',
  },
  customModalProps: {
    type: Object,
    default: () => ({}),
  },
})

const expansionStore = useExpansionsStore()
const sourcesStore = useSourcesStore()
const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const sources = sourcesStore.sources

// Check if user is admin
const isAdmin = computed(() => authStore.isAdmin)

const selectedConcept = ref(null)
const showConceptDetail = ref(false)
const expansions = ref([])
const conceptDetailKey = ref(0)
const searchQuery = ref('')
const expansionFilter = ref('')

// Proper pluralization for item names
const itemNamePlural = computed(() => {
  const name = props.itemName.toLowerCase()
  // Handle special cases
  if (name === 'ancestry') return 'ancestries'
  if (name === 'mestiere') return 'mestieri'
  // Default: add 's'
  return `${name}s`
})

const expansionFilterOptions = computed(() => ({
  grouped: false,
  items: expansions.value || []
}))

const hasPreviousConcept = computed(() => {
  if (!selectedConcept.value) return false;
  const currentIndex = filteredConcepts.value.findIndex(c => c.id === selectedConcept.value.id);
  return currentIndex > 0;
})

const hasNextConcept = computed(() => {
  if (!selectedConcept.value) return false;
  const currentIndex = filteredConcepts.value.findIndex(c => c.id === selectedConcept.value.id);
  return currentIndex < filteredConcepts.value.length - 1 && currentIndex >= 0;
})

const conceptsWithLogo = computed(() => {
  return props.concepts.map(concept => {
    const expansion = expansions.value.find(e => e.id === concept.expansion)
    return {
      ...concept,
      expansionLogoUrl: expansion && expansion.logoUrl ? expansion.logoUrl : '',
    }
  })
})

const filteredConcepts = computed(() => {
  let filtered = conceptsWithLogo.value

  if (!props.showFilters) {
    return filtered
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((concept) =>
      concept.name?.toLowerCase().includes(query) ||
      concept.description?.toLowerCase().includes(query)
    )
  }

  if (expansionFilter.value) {
    filtered = filtered.filter((concept) => concept.expansion === expansionFilter.value)
  }

  return filtered
})

const createConcept = async () => {
  try {
    const createdConcept = await props.createConceptFn()
    await props.refreshDataFn()

    // Find the freshly fetched concept by id
    const conceptFromStore = props.concepts.find(c => c.id === createdConcept.id)
    selectedConcept.value = conceptFromStore || createdConcept

    // If this is a character modal, also set it as the selected character in the store
    if (props.modalComponent === 'CharacterSheetModal') {
      charactersStore.selectCharacter(selectedConcept.value)
    }

    showConceptDetail.value = true
  } catch (error) {
    console.error(`Error creating ${props.itemName}:`, error)
  }
}

const updateConcept = async (updatedConcept) => {
  try {
    await props.updateConceptFn(updatedConcept)
    selectedConcept.value = updatedConcept
    await props.refreshDataFn()
  } catch (error) {
    console.error(`Error updating ${props.itemName}:`, error)
  }
}

const deleteConcept = async (concept) => {
  try {
    await props.deleteConceptFn(concept)
    if (selectedConcept.value?.id === concept.id) {
      closeConceptDetail()
    }
    await props.refreshDataFn()
  } catch (error) {
    console.error(`Error deleting ${props.itemName}:`, error)
  }
}

const openConceptDetail = (concept) => {
  selectedConcept.value = concept

  // If this is a character modal, also set it as the selected character in the store
  if (props.modalComponent === 'CharacterSheetModal') {
    charactersStore.selectCharacter(concept)
  }

  showConceptDetail.value = true
  conceptDetailKey.value++

  // Create URL-friendly name (convert to lowercase, replace spaces with hyphens)
  const urlName = concept.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Update URL with concept name (only if not already there)
  if (route.params.id !== urlName) {
    const basePath = route.path.split('/').slice(0, 2).join('/')
    router.push(`${basePath}/${urlName}`)
  }
}

const navigateConcept = (direction) => {
  if (!selectedConcept.value) return;
  const currentIndex = filteredConcepts.value.findIndex(c => c.id === selectedConcept.value.id);
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= filteredConcepts.value.length) return;
  selectedConcept.value = filteredConcepts.value[newIndex];

  // If this is a character modal, also update the selected character in the store
  if (props.modalComponent === 'CharacterSheetModal') {
    charactersStore.selectCharacter(selectedConcept.value)
  }

  conceptDetailKey.value++;

  // Create URL-friendly name
  const urlName = selectedConcept.value.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Update URL with new concept name
  const basePath = route.path.split('/').slice(0, 2).join('/')
  router.push(`${basePath}/${urlName}`)
}

const closeConceptDetail = () => {
  // We no longer deselect the character when closing the character sheet
  // This allows the selection to be "sticky"
  selectedConcept.value = null
  showConceptDetail.value = false

  // Return to base route without ID (only if currently on a detail route)
  if (route.params.id) {
    const basePath = route.path.split('/').slice(0, 2).join('/')
    router.push(basePath)
  }
}

const handleKeyNavigation = (event) => {
  if (!showConceptDetail.value) return;

  if (event.target.tagName === 'INPUT' ||
    event.target.tagName === 'TEXTAREA' ||
    event.target.isContentEditable) {
    return;
  }

  switch (event.key) {
    case 'ArrowLeft':
      if (hasPreviousConcept.value) {
        navigateConcept(-1);
      }
      break;
    case 'ArrowRight':
      if (hasNextConcept.value) {
        navigateConcept(1);
      }
      break;
    case 'Escape':
      closeConceptDetail();
      break;
  }
}

onMounted(async () => {
  try {
    await expansionStore.fetch()
    expansions.value = expansionStore.expansions
    window.addEventListener('keydown', handleKeyNavigation);

    // Check if there's a name in the route
    if (route.params.id) {
      // Wait for concepts to be loaded
      await props.refreshDataFn()
      // Convert URL name back to find matching concept (case-insensitive comparison)
      const urlName = route.params.id.toLowerCase()
      const conceptToOpen = props.concepts.find(c =>
        c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === urlName
      )
      if (conceptToOpen) {
        openConceptDetail(conceptToOpen)
      }
    }
    // If this is the CharactersPage and there's already a selected character,
    // automatically open its character sheet
    else if (props.modalComponent === 'CharacterSheetModal' && charactersStore.hasSelectedCharacter) {
      const selectedCharacter = charactersStore.selectedCharacter
      const character = props.concepts.find(c => c.id === selectedCharacter.id)
      if (character) {
        openConceptDetail(character)
      }
    }
  } catch (error) {
    console.error('Error initializing ConceptsLayout:', error);
  }
})

// Watch for route changes (browser back/forward)
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    if (newId) {
      // Convert URL name to find matching concept
      const urlName = newId.toLowerCase()
      const conceptToOpen = props.concepts.find(c =>
        c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === urlName
      )
      if (conceptToOpen) {
        selectedConcept.value = conceptToOpen
        if (props.modalComponent === 'CharacterSheetModal') {
          charactersStore.selectCharacter(conceptToOpen)
        }
        showConceptDetail.value = true
        conceptDetailKey.value++
      }
    } else {
      // No ID in route, close the modal
      selectedConcept.value = null
      showConceptDetail.value = false
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyNavigation);
})
</script>

<style scoped>
.concepts-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
}

.concepts-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 50px;
}
</style>
