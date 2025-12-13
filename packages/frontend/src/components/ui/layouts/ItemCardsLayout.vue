<template>
  <div class="item-cards-view" ref="containerRef">
    <!-- Search and Filter Controls -->
    <FilterControls v-model:search-query="searchQueryLocal" v-model:primary-filter="sourceFilterLocal"
      v-model:sort-option="sortOptionLocal" :search-placeholder="`Search ${itemTypePlural.toLowerCase()}...`"
      :primary-filter-options="sourceFilterOptions" primary-filter-label="All Sources" :sort-options="sortOptions"
      :show-add-button="isAdmin" @create="createItem">
      <template #additional-filters>
        <slot name="additional-filters"></slot>
      </template>
    </FilterControls>

    <!-- Item Cards-->
    <MasonryGrid :column-width="350" :gap="20" :row-height="10" class="cards-container" ref="masonryGrid">
      <slot name="item-cards" :filtered-items="filteredItems"></slot>
    </MasonryGrid>

    <!-- Loading indicator -->
    <div v-if="hasMore" class="loading-indicator" ref="loadingIndicatorRef">
      <span class="loading-text">Loading more items...</span>
    </div>

    <slot name="modals"></slot>
  </div>
</template>

<script setup>
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import FilterControls from '@/components/ui/FilterControls.vue'
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

const props = defineProps({
  itemType: { type: String, required: true },
  itemTypePlural: { type: String, required: true },
  sources: {
    type: Object,
    required: true,
    default: () => ({ ancestries: [], cultures: [], mestieri: [], worldElements: [] }),
  },
  searchQuery: { type: String, default: '' },
  sourceFilter: { type: String, default: '' },
  sortOption: { type: String, default: '' },
  sortOptions: { type: Object, default: () => ({}) },
  items: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
})

const emit = defineEmits(['update:searchQuery', 'update:sourceFilter', 'update:sortOption', 'update:filteredItems', 'create', 'loadMore'])

const masonryGrid = ref(null)
const containerRef = ref(null)
const loadingIndicatorRef = ref(null)
let intersectionObserver = null

const searchQueryLocal = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value),
})

const sourceFilterLocal = computed({
  get: () => props.sourceFilter,
  set: (value) => emit('update:sourceFilter', value),
})

const sortOptionLocal = computed({
  get: () => props.sortOption,
  set: (value) => emit('update:sortOption', value),
})

const sourceFilterOptions = computed(() => ({
  grouped: true,
  sources: props.sources
}))

const filteredItems = computed(() => {
  const query = searchQueryLocal.value.toLowerCase().trim()
  const sourceFilter = sourceFilterLocal.value

  // Filter out deleted items
  let filtered = (props.items || []).filter((item) => !item.isDeleted)

  // Apply source filter
  if (sourceFilter) {
    filtered = filtered.filter((item) => item.source === sourceFilter)
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
  if (sortOptionLocal.value) {
    const [field, direction] = sortOptionLocal.value.split('-')
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

  emit('update:filteredItems', filtered)
  return filtered
})

const createItem = () => {
  emit('create')
}

// Method to handle card height changes
const onCardHeightChanged = (delay = 0) => {
  if (masonryGrid.value) {
    if (delay > 0) {
      masonryGrid.value.updateLayoutDelayed(delay)
    } else {
      masonryGrid.value.updateLayout()
    }
  }
}

// Setup intersection observer for infinite scroll
const setupIntersectionObserver = () => {
  if (!loadingIndicatorRef.value) return

  // Disconnect existing observer if any
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && props.hasMore) {
        emit('loadMore')
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
  )

  intersectionObserver.observe(loadingIndicatorRef.value)
}

onMounted(() => {
  setupIntersectionObserver()
})

onBeforeUnmount(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})

// Watch for changes in hasMore and items to reset the observer
watch([() => props.hasMore, () => props.items.length], () => {
  // Use nextTick to ensure DOM has updated
  setTimeout(() => {
    setupIntersectionObserver()
  }, 10)
})

// Expose the method so parent components can call it
defineExpose({ onCardHeightChanged })
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.item-cards-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
}

.cards-container {
  padding: var(--space-sm);
  overflow: visible;
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
