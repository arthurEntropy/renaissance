<template>
    <div class="rules-view">
      <div class="rules-header">
        <h1>Game Rules</h1>
        <button class="button button-primary" @click="openRulesModal()">Open Rules</button>
      </div>
      
      <!-- Rules Modal -->
      <RulesModal 
        v-if="showRulesModal"
        :initialSectionId="selectedSectionId"
        @close="closeRulesModal"
      />
    </div>
  </template>
  
<script>
import { useRulesStore } from '@/stores/rulesStore';
import RulesModal from '@/components/modals/RulesModal.vue';

export default {
  components: {
    RulesModal
  },
  
  data() {
    return {
      rulesStore: useRulesStore(),
      showRulesModal: false,
      selectedSectionId: null
    };
  },
  
  async created() {
    await this.rulesStore.fetchRules(); // Updated method name
  },
  
  methods: {
    openRulesModal(sectionId = null) {
      this.selectedSectionId = sectionId;
      this.showRulesModal = true;
    },
    
    closeRulesModal() {
      this.showRulesModal = false;
      this.selectedSectionId = null;
    }
  }
};
</script>
  
  <style scoped>
  .rules-view {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }
  
  .rules-header {
    margin-bottom: 40px;
  }
  
  h1 {
    color: white;
    font-size: 2.5rem;
    margin-bottom: 20px;
  }
  </style>