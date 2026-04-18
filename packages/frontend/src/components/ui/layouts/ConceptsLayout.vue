<template>
  <div class="concepts-view">

    <!-- Filter Controls: hidden when concept detail is open -->
    <FilterControls v-show="!showConceptDetail || modalComponent === 'CharacterSheetModal'"
      v-model:search-query="searchQuery" v-model:primary-filter="expansionFilter"
      :search-placeholder="searchPlaceholder" :primary-filter-options="primaryFilterOptions"
      :primary-filter-label="primaryFilterLabel" :show-add-button="isAdmin" @create="createConcept" />

    <!-- Selection Cards: hidden when concept detail is open -->
    <div v-show="!showConceptDetail || modalComponent === 'CharacterSheetModal'" class="concept-cards-container">
      <ConceptCard v-for="concept in filteredConcepts" :key="concept.id" :concept="concept" :sources="sources"
        :expansions="expansionStore.items" @select="openConceptDetail" />
    </div>

    <!-- Detail / Character Sheet with Navigation Controls -->
    <NavigationControls v-if="showConceptDetail" :has-previous="hasPreviousConcept" :has-next="hasNextConcept"
      @navigate="navigateConcept">

      <!-- Character Sheet Modal -->
      <CharacterSheetModal v-if="modalComponent === 'CharacterSheetModal'" :key="`character-${props.selectedItem?.id}`"
        @close="closeConceptDetail" />

      <!-- Concept Detail -->
      <ConceptDetail v-else :key="`concept-${props.selectedItem?.id}`" :editable="isAdmin"
        @close="closeConceptDetail" />
    </NavigationControls>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useAuthStore } from '@/stores/authStore'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { createSlug, findConceptBySlug, getBasePath } from '@/utils/urlHelpers'
import ConceptCard from '@/components/ui/cards/concept/ConceptCard.vue'
import FilterControls from '@/components/ui/FilterControls.vue'
import NavigationControls from '@/components/ui/NavigationControls.vue'
import ConceptDetail from '@/components/features/conceptDetail/ConceptDetail.vue'
import CharacterSheetModal from '@/components/features/characterSheet/CharacterSheet.vue'

// Props
const props = defineProps({
  concepts: {
    type: Array,
    default: () => [],
  },
  selectedItem: {
    type: Object,
    default: null,
  },
  storageKey: {
    type: String,
    required: true,
  },
  stickySelection: {
    type: Boolean,
    default: false,
  },
  showExpansionFilter: {
    type: Boolean,
    default: true,
  },
  modalComponent: {
    type: String,
    default: 'ConceptDetail',
  },
})

const emit = defineEmits(['select', 'deselect', 'create'])

const expansionStore = useExpansionsStore()
const sourcesStore = useSourcesStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const sources = sourcesStore.sources

// Check if user is admin
const isAdmin = computed(() => authStore.isAdmin)

// Filter configuration
const searchPlaceholder = 'Search...'
const primaryFilterLabel = 'All Expansions'
const primaryFilterOptions = computed(() => props.showExpansionFilter ? expansionStore.items || [] : [])

const showConceptDetail = ref(false)
const searchQuery = ref('')
const expansionFilter = ref('')

// Filter persistence
useFilterPersistence(
  props.storageKey,
  {
    searchQuery,
    expansionFilter
  }
)

const currentIndex = computed(() => {
  if (!props.selectedItem) return -1;
  return filteredConcepts.value.findIndex(c => c.id === props.selectedItem.id);
})

const hasPreviousConcept = computed(() => currentIndex.value > 0)

const hasNextConcept = computed(() => {
  const index = currentIndex.value;
  return index >= 0 && index < filteredConcepts.value.length - 1;
})

const filteredConcepts = computed(() => {
  let filtered = props.concepts

  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((concept) =>
      concept.name?.toLowerCase().includes(query) ||
      concept.description?.toLowerCase().includes(query)
    )
  }

  // Apply expansion filter
  if (expansionFilter.value) {
    filtered = filtered.filter((concept) => concept.expansion === expansionFilter.value)
  }

  // Concepts are already sorted by conceptsStore
  return filtered
})

const updateConceptUrl = (conceptName) => {
  const slug = createSlug(conceptName)
  if (route.params.id !== slug) {
    const basePath = getBasePath(route.path)
    router.push(`${basePath}/${slug}`)
  }
}

const createConcept = () => {
  emit('create')
  showConceptDetail.value = true
}

const openConceptDetail = (concept) => {
  emit('select', concept)
  showConceptDetail.value = true
  updateConceptUrl(concept.name)
}

const navigateConcept = (direction) => {
  const index = currentIndex.value;
  if (index === -1) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= filteredConcepts.value.length) return;

  const newConcept = filteredConcepts.value[newIndex];

  emit('select', newConcept)
  updateConceptUrl(newConcept.name)
}

const closeConceptDetail = () => {
  // Emit deselect event (unless sticky selection)
  // Character selections remain "sticky" for active gameplay session
  if (!props.stickySelection) {
    emit('deselect')
  }
  showConceptDetail.value = false

  // Return to base route without ID (only if currently on a detail route)
  if (route.params.id) {
    const basePath = getBasePath(route.path)
    router.push(basePath)
  }
}

const handleKeyNavigation = (event) => {
  if (!showConceptDetail.value) return;

  // Ignore key events when focused on input fields
  if (event.target.tagName === 'INPUT' ||
    event.target.tagName === 'TEXTAREA' ||
    event.target.isContentEditable) {
    return;
  }
  // Supporting arrow key navigation and Escape key to close
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
    window.addEventListener('keydown', handleKeyNavigation);

    // Auto-open concept if URL has an ID param
    if (route.params.id) {
      const conceptToOpen = findConceptBySlug(props.concepts, route.params.id)
      if (conceptToOpen) {
        openConceptDetail(conceptToOpen)
      }
    }
    // If sticky selection is enabled and there's already a selected item,
    // automatically open it (e.g., character sheet for active gameplay)
    else if (props.stickySelection && props.selectedItem) {
      const concept = props.concepts.find(c => c.id === props.selectedItem.id)
      if (concept) {
        openConceptDetail(concept)
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
      const conceptToOpen = findConceptBySlug(props.concepts, newId)
      if (conceptToOpen) {
        emit('select', conceptToOpen)
        showConceptDetail.value = true
      }
    } else {
      // No ID in route, close the modal
      if (!props.stickySelection) {
        emit('deselect')
      }
      showConceptDetail.value = false
    }
  }
})

// Watch for concepts to be loaded and open detail if URL has ID param
watch(() => props.concepts, (newConcepts) => {
  if (newConcepts.length > 0 && route.params.id && !showConceptDetail.value) {
    const conceptToOpen = findConceptBySlug(newConcepts, route.params.id)
    if (conceptToOpen) {
      openConceptDetail(conceptToOpen)
    }
  }
}, { immediate: true })

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

.concept-cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 50px;
}
</style>
