<template>
  <div class="concepts-view">
    <!-- Filter Controls (conditionally shown) -->
    <FilterControls v-if="showFilters" v-model:search-query="searchQuery" v-model:primary-filter="expansionFilter"
      :search-placeholder="`Search ${itemName.toLowerCase()}s...`" :primary-filter-options="expansionFilterOptions"
      primary-filter-label="All Expansions" primary-filter-class="expansion-filter" />

    <!-- Selection Cards -->
    <div class="concepts-container">
      <ConceptCard v-for="concept in filteredConcepts" :key="concept.id" :concept="concept" :sources="sources"
        @select="openConceptDetail" />
      <AddConceptCard :concept-name="itemName" @click="createConcept" />
    </div>

    <!-- Modal with Navigation Controls -->
    <NavigationControls v-if="showConceptDetail" :has-previous="hasPreviousConcept" :has-next="hasNextConcept"
      @navigate="navigateConcept">

      <!-- Character Sheet Modal -->
      <CharacterSheetModal v-if="modalComponent === 'CharacterSheetModal'" :key="`character-${conceptDetailKey}`"
        v-bind="customModalProps" @close="closeConceptDetail" @update:character="updateConcept"
        @delete:character="deleteConcept" />

      <!-- Concept Detail Modal -->
      <ConceptDetail v-else :key="`concept-${conceptDetailKey}`" :concept="selectedConcept" :editable="true"
        @close="closeConceptDetail" @update="updateConcept" />
    </NavigationControls>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useCharactersStore } from '@/stores/charactersStore'
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
const sources = sourcesStore.sources

const selectedConcept = ref(null)
const showConceptDetail = ref(false)
const expansions = ref([])
const conceptDetailKey = ref(0)
const searchQuery = ref('')
const expansionFilter = ref('')

const expansionFilterOptions = computed(() => ({
  grouped: false,
  items: expansions.value || []
}))

const hasPreviousConcept = computed(() => {
  if (!selectedConcept.value) return false;
  const currentIndex = props.concepts.findIndex(c => c.id === selectedConcept.value.id);
  return currentIndex > 0;
})

const hasNextConcept = computed(() => {
  if (!selectedConcept.value) return false;
  const currentIndex = props.concepts.findIndex(c => c.id === selectedConcept.value.id);
  return currentIndex < props.concepts.length - 1 && currentIndex >= 0;
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

    selectedConcept.value = createdConcept
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
}

const navigateConcept = (direction) => {
  if (!selectedConcept.value) return;
  const currentIndex = props.concepts.findIndex(c => c.id === selectedConcept.value.id);
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= props.concepts.length) return;
  selectedConcept.value = props.concepts[newIndex];

  // If this is a character modal, also update the selected character in the store
  if (props.modalComponent === 'CharacterSheetModal') {
    charactersStore.selectCharacter(selectedConcept.value)
  }

  conceptDetailKey.value++;
}

const closeConceptDetail = () => {
  // If this is a character modal, deselect the character in the store
  if (props.modalComponent === 'CharacterSheetModal') {
    charactersStore.deselectCharacter()
  }

  selectedConcept.value = null
  showConceptDetail.value = false
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
  } catch (error) {
    console.error('Error initializing ConceptsLayout:', error);
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
