<template>
  <div class="item-cards-view">

    <!-- Search and Filter Controls -->
    <div class="filter-controls">
      <input type="text" v-model="searchQueryLocal" class="search-input"
        :placeholder="`Search ${itemTypePlural.toLowerCase()}...`" />
      <select v-model="sourceFilterLocal" class="source-filter">
        <option value="">All Sources</option>
        <optgroup label="Ancestries">
          <option v-for="ancestry in sources.ancestries" :key="ancestry.id" :value="ancestry.id">
            {{ ancestry.name }}
          </option>
        </optgroup>
        <optgroup label="Cultures">
          <option v-for="culture in sources.cultures" :key="culture.id" :value="culture.id">
            {{ culture.name }}
          </option>
        </optgroup>
        <optgroup label="Mestieri">
          <option v-for="mestiere in sources.mestieri" :key="mestiere.id" :value="mestiere.id">
            {{ mestiere.name }}
          </option>
        </optgroup>
        <optgroup label="World Elements">
          <option v-for="worldElement in sources.worldElements" :key="worldElement.id" :value="worldElement.id">
            {{ worldElement.name }}
          </option>
        </optgroup>
      </select>
      <select v-if="sortOptions && Object.keys(sortOptions).length > 0" v-model="sortOptionLocal" class="sort-filter">
        <option value="">Sort by...</option>
        <optgroup v-for="(options, group) in sortOptions" :key="group" :label="group">
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </optgroup>
      </select>
      <slot name="additional-filters"></slot>
      <ActionButton variant="primary" size="large" text="+ Add" @click="createItem" />
    </div>

    <!-- Item Cards-->
    <MasonryGrid :column-width="350" :gap="20" :row-height="10" class="cards-container" ref="masonryGrid">
      <slot name="item-cards" :filtered-items="filteredItems"></slot>
    </MasonryGrid>

    <slot name="modals"></slot>
  </div>
</template>

<script setup>
import MasonryGrid from '@/components/MasonryGrid.vue'
import ActionButton from '@/components/ActionButton.vue'
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
      let comparison = 0

      const aVal = a?.[field]
      const bVal = b?.[field]

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (field === 'name') {
        comparison = String(aVal).localeCompare(String(bVal))
      } else {
        comparison = Number(aVal) - Number(bVal)
      }

      return direction === 'asc' ? comparison : -comparison
    })
  }

  emit('update:filteredItems', filtered)
  return filtered
})

function createItem() {
  emit('create')
}
</script>

<style scoped>
.item-cards-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 60%;
  margin-bottom: 1rem;
  padding: 0 2rem;
  z-index: 1;
}

.search-input {
  flex: 2;
  padding: 8px 12px;
  border: 1px solid var(--color-gray-medium);
  border-radius: 4px;
  background-color: var(--overlay-black-medium);
  font-size: 16px;
}

.source-filter,
.sort-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-gray-medium);
  border-radius: 4px;
  background-color: var(--overlay-black-medium);
  font-size: 16px;
  color: white;
}

.source-filter optgroup,
.sort-filter optgroup {
  background-color: black;
}

.source-filter option,
.sort-filter option {
  background-color: var(--overlay-black-heavy);
  padding: 8px;
}

.search-input::placeholder {
  color: var(--color-gray-light);
}

.search-input:focus,
.source-filter:focus,
.sort-filter:focus {
  outline: none;
  border-color: var(--color-gray-light);
  box-shadow: 0 0 5px var(--overlay-white-subtle);
}

.cards-container {
  padding: 0.5rem;
  overflow: visible;
}
</style>
