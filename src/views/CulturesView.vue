<template>
  <div class="culture-selection" v-if="!selectedCulture">
    <h2>CULTURES</h2>
    <div class="selection-cards-container">
      <SelectionCard 
        v-for="culture in cultures" 
        :key="culture.id" 
        :item="culture" 
        @select="selectCulture(culture)"
      />
    </div>
  </div>
  
  <ConceptDetail 
    v-else 
    :concept="selectedCulture" 
    @close="closeDetailView" 
  />
</template>

<script>
  import { useCulturesStore } from '@/stores/culturesStore';
  import { mapState } from 'pinia';
  import SelectionCard from '@/components/SelectionCard.vue';
  import ConceptDetail from '@/components/ConceptDetail.vue';

  export default {
    components: {
      SelectionCard,
      ConceptDetail,
    },
    data() {
      return {
        store: useCulturesStore(),
        selectedCulture: null,
      };
    },
    computed: {
      ...mapState(useCulturesStore, ['cultures']),
    },
    methods: {
      selectCulture(culture) {
        this.selectedCulture = culture;
      },
      closeDetailView() {
        this.selectedCulture = null;
      },
    },
    mounted() {
      this.store.fetchCultures();
    },
  };
</script>

<style scoped>
  .culture-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    flex-grow: 1;
    margin: 0 auto;
    padding: 1rem;
  }

  .selection-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 50px;
  }
</style>