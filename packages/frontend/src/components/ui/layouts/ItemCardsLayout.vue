<template>
  <div class="item-cards-layout">

    <!-- Search and Filter Controls -->
    <FilterControls v-model:search-query="searchQueryLocal" v-model:sort-option="sortOptionLocal"
      :sort-options="sortOptions" :show-add-button="isAdmin" @create="createItem">

      <!-- Source Filter -->
      <template #additional-filters>
        <SourceCascadePicker v-model="sourceFilterLocal" id="source-filter" placeholder="All Sources"
          select-class="source-filter" :show-group-options="showSourceGroupOptions" />

        <!-- Additional filters slot for parent (e.g., equipment categories) -->
        <slot name="additional-filters"></slot>
      </template>
    </FilterControls>

    <!-- Item Cards -->
    <MasonryGrid :column-width="350" :gap="20" :row-height="10" class="cards-container" role="list">
      <slot name="item-cards" :items="props.items"></slot>
    </MasonryGrid>

    <!-- Loading Indicator Slot - allows parent to attach ref and manage observer for infinite scroll -->
    <slot name="loading-indicator" :hasMore="hasMore" :isLoadingMore="isLoadingMore">
      <div v-if="hasMore" class="loading-indicator">
        <span v-if="isLoadingMore" class="loading-text">Loading more items...</span>
      </div>
    </slot>

    <slot name="modals"></slot>
  </div>
</template>

<script setup>
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import SourceCascadePicker from '@/components/ui/pickers/SourceCascadePicker.vue'
import FilterControls from '@/components/ui/FilterControls.vue'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

const props = defineProps({
  searchQuery: { type: String, default: '' },
  sourceFilter: { type: String, default: '' },
  sortOption: { type: String, default: '' },
  sortOptions: { type: Object, default: () => ({}) },
  items: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
  isLoadingMore: { type: Boolean, default: false },
  showSourceGroupOptions: { type: Boolean, default: false },
})

const emit = defineEmits(['update:searchQuery', 'update:sourceFilter', 'update:sortOption', 'create', 'load-more'])

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

const createItem = () => {
  emit('create')
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.item-cards-layout {
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
