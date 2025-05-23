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
      <slot name="additional-filters"></slot>
      <button class="button button-primary" @click="createItem">
        Create New
      </button>
    </div>

    <!-- Item Cards-->
    <masonry-grid :column-width="350" :gap="20" :row-height="10" class="cards-container">
      <slot name="item-cards"></slot>
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
  },
  methods: {
    createItem() {
      this.$emit('create')
    },
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

.source-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
}

.source-filter optgroup {
  background-color: black;
}

.source-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus,
.source-filter:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

.cards-container {
  padding: 0.5rem;
  overflow: visible;
}
</style>
