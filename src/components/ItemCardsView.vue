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
      <select v-if="sortOptions.length > 0" v-model="sortOptionLocal" class="sort-filter">
        <option value="">Sort by...</option>
        <optgroup v-for="(options, group) in sortOptions" :key="group" :label="group">
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </optgroup>
      </select>
      <slot name="additional-filters"></slot>
      <button class="button button-primary" @click="createItem">
        Create New
      </button>
    </div>

    <!-- Item Cards-->
    <masonry-grid :column-width="350" :gap="20" :row-height="10" class="cards-container" ref="masonryGrid">
      <slot name="item-cards" :filtered-items="filteredItems"></slot>
    </masonry-grid>

    <slot name="modals"></slot>
  </div>
</template>

<script>
import MasonryGrid from '@/components/MasonryGrid.vue'

export default {
  name: 'ItemCardsView',
  components: {
    MasonryGrid,
  },
  props: {
    itemType: {
      type: String,
      required: true,
    },
    itemTypePlural: {
      type: String,
      required: true,
    },
    sources: {
      type: Object,
      required: true,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      }),
    },
    searchQuery: {
      type: String,
      default: '',
    },
    sourceFilter: {
      type: String,
      default: '',
    },
    sortOption: {
      type: String,
      default: '',
    },
    sortOptions: {
      type: Object,
      default: () => ({}),
    },
    items: {
      type: Array,
      default: () => [],
    }
  },
  computed: {
    searchQueryLocal: {
      get() {
        return this.searchQuery
      },
      set(value) {
        this.$emit('update:searchQuery', value)
      },
    },
    sourceFilterLocal: {
      get() {
        return this.sourceFilter
      },
      set(value) {
        this.$emit('update:sourceFilter', value)
      },
    },
    sortOptionLocal: {
      get() {
        return this.sortOption
      },
      set(value) {
        this.$emit('update:sortOption', value)
      },
    },
    filteredItems() {
      const query = this.searchQueryLocal.toLowerCase().trim()
      const sourceFilter = this.sourceFilterLocal

      // Filter out deleted items
      let filtered = this.items.filter(item => !item.isDeleted)

      // Apply source filter
      if (sourceFilter) {
        filtered = filtered.filter(item => item.source === sourceFilter)
      }

      // Apply search query
      if (query) {
        filtered = filtered.filter(
          item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        )
      }

      // Apply sorting
      if (this.sortOptionLocal) {
        const [field, direction] = this.sortOptionLocal.split('-')
        filtered.sort((a, b) => {
          let comparison = 0

          // Handle null/undefined values
          if (!a[field] && !b[field]) return 0
          if (!a[field]) return 1
          if (!b[field]) return -1

          // Compare based on field type
          if (field === 'name') {
            comparison = a[field].localeCompare(b[field])
          } else {
            comparison = a[field] - b[field]
          }

          return direction === 'asc' ? comparison : -comparison
        })
      }

      // Emit the filtered items so parent components can access them
      this.$emit('update:filteredItems', filtered)

      return filtered
    }
  },
  methods: {
    createItem() {
      this.$emit('create')
    },

    onCardHeightChanged() {
      this.$nextTick(() => {
        if (this.$refs.masonryGrid && typeof this.$refs.masonryGrid.updateLayout === 'function') {
          this.$refs.masonryGrid.updateLayout()
        }
      })
    }
  },
}
</script>

<style scoped>
.item-cards-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
}

.source-filter,
.sort-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  color: white;
}

.source-filter optgroup,
.sort-filter optgroup {
  background-color: black;
}

.source-filter option,
.sort-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus,
.source-filter:focus,
.sort-filter:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

.cards-container {
  padding: 0.5rem;
  overflow: visible;
}
</style>
