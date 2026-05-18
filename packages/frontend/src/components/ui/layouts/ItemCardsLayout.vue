<template>
  <div :class="['item-cards-layout', { 'item-cards-layout--constrained': constrainToColumnWidths }]">

    <!-- Filter Bar -->
    <FilterBar v-model:searchQuery="searchQueryLocal" v-model:selectedTags="selectedTagsLocal"
      v-model:groupBy="groupByLocal" v-model:orderBy="sortOptionLocal" :tag-groups="resolvedTagGroups"
      :tag-picker-mode="tagPickerMode" :multiselect="tagMultiselect" :group-options="groupOptions"
      :order-options="sortOptions" :show-add-button="isAdmin" search-placeholder="Search..."
      :tag-search-placeholder="tagSearchPlaceholder" :stats="stats" :hide-to-top-button="hideToTopButton"
      @add="createItem">
      <template #additional-filters>
        <slot name="additional-filters"></slot>
      </template>
      <template v-if="slots.actions" #actions>
        <slot name="actions"></slot>
      </template>
    </FilterBar>

    <!-- Item Cards -->
    <MasonryGrid :gap="20" :row-height="10" class="cards-container" role="list">
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
import FilterBar from '@/components/ui/FilterBar.vue'
import { computed, useSlots } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { SOURCE_COLLECTION_TYPES } from '@/constants/sourceTypes'

const authStore = useAuthStore()
const sourcesStore = useSourcesStore()
const slots = useSlots()
const isAdmin = computed(() => authStore.isAdmin)

const props = defineProps({
  searchQuery: { type: String, default: '' },
  sourceFilter: { type: String, default: '' },
  tagFilters: { type: Array, default: null },
  tagGroups: { type: Array, default: null },
  tagPickerMode: { type: String, default: 'flat' },
  tagMultiselect: { type: Boolean, default: false },
  tagSearchPlaceholder: { type: String, default: 'Filter by source...' },
  groupBy: { type: String, default: '' },
  groupOptions: { type: [Array, Object], default: () => [] },
  sortOption: { type: String, default: '' },
  sortOptions: { type: Object, default: () => ({}) },
  items: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
  isLoadingMore: { type: Boolean, default: false },
  showSourceGroupOptions: { type: Boolean, default: false },
  stats: { type: Array, default: () => [] },
  hideToTopButton: { type: Boolean, default: false },
  constrainToColumnWidths: { type: Boolean, default: false },
})

const emit = defineEmits(['update:searchQuery', 'update:sourceFilter', 'update:tagFilters', 'update:groupBy', 'update:sortOption', 'create', 'load-more'])

const hasExplicitTagFilters = computed(() => Array.isArray(props.tagFilters))

// Bridge:
// 1) If parent provides tagFilters, use them directly.
// 2) Otherwise maintain backward compatibility via sourceFilter string.
const selectedTagsLocal = computed({
  get: () => hasExplicitTagFilters.value ? props.tagFilters : (props.sourceFilter ? [props.sourceFilter] : []),
  set: (tags) => {
    if (hasExplicitTagFilters.value) {
      emit('update:tagFilters', tags)
      return
    }
    emit('update:sourceFilter', tags[0] || '')
  },
})

const searchQueryLocal = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value),
})

const groupByLocal = computed({
  get: () => props.groupBy,
  set: (value) => emit('update:groupBy', value),
})

const sortOptionLocal = computed({
  get: () => props.sortOption,
  set: (value) => emit('update:sortOption', value),
})

// Build tag groups from the sources store, optionally prepending group-select items
const defaultSourceTagGroups = computed(() =>
  SOURCE_COLLECTION_TYPES
    .map(sourceType => {
      const items = sourcesStore.sources[sourceType.listKey] || []
      if (!items.length) return null
      const groupItems = props.showSourceGroupOptions
        ? [{ id: `type:${sourceType.id}`, name: `All ${sourceType.label}` }, ...items]
        : items
      return { label: sourceType.label, items: groupItems }
    })
    .filter(Boolean)
)

const resolvedTagGroups = computed(() => {
  if (Array.isArray(props.tagGroups) && props.tagGroups.length > 0) {
    return props.tagGroups
  }
  return defaultSourceTagGroups.value
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
  max-width: 1460px;
  margin: 0 auto;
}

/*
 * When constrainToColumnWidths is true, the container's max-width snaps to
 * the exact width of the masonry column content at each column-count breakpoint
 * (--card-width=350px, gap=20px): 4-col=1460px, 3-col=1090px, 2-col=720px, 1-col=350px.
 * This keeps the FilterBar aligned with the card grid below it.
 *
 * Viewport breakpoints are derived from the 90%-width container:
 *   4-col: viewport >= 1460 / 0.9 ≈ 1623px
 *   3-col: viewport >= 1090 / 0.9 ≈ 1212px
 *   2-col: viewport >= 720  / 0.9 = 800px
 */
.item-cards-layout--constrained {
  max-width: 1090px;
  /* 3-column default */
}

@media (min-width: 1623px) {
  .item-cards-layout--constrained {
    max-width: 1480px;
    /* 4 columns */
  }
}

@media (max-width: 1211px) {
  .item-cards-layout--constrained {
    max-width: 720px;
    /* 2 columns */
  }
}

@media (max-width: 799px) {
  .item-cards-layout--constrained {
    max-width: 350px;
    /* 1 column */
  }
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
