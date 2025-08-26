<template>
  <div class="item-cards-view">
    <!-- Search and Filter Controls -->
    <FilterControls v-model:search-query="searchQueryLocal" v-model:primary-filter="sourceFilterLocal"
      v-model:sort-option="sortOptionLocal" :search-placeholder="`Search ${itemTypePlural.toLowerCase()}...`"
      :primary-filter-options="sourceFilterOptions" primary-filter-label="All Sources"
      primary-filter-class="source-filter" :sort-options="sortOptions" :show-add-button="true"
      :add-button-text="`+ Add ${itemType}`" @create="createItem">
      <template #additional-filters>
        <slot name="additional-filters"></slot>
      </template>
    </FilterControls>

    <!-- Item Cards-->
    <MasonryGrid :column-width="350" :gap="20" :row-height="10" class="cards-container" ref="masonryGrid">
      <slot name="item-cards" :filtered-items="filteredItems"></slot>
    </MasonryGrid>

    <slot name="modals"></slot>
  </div>
</template>

<script setup>
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import FilterControls from '@/components/ui/FilterControls.vue'
import { computed, ref } from 'vue'

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
})

const emit = defineEmits(['update:searchQuery', 'update:sourceFilter', 'update:sortOption', 'update:filteredItems', 'create'])

const masonryGrid = ref(null)

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
</style>
