<template>
  <div class="ancestry-selection" v-if="!selectedAncestry">
    <h2>ANCESTRIES</h2>
    <div class="selection-cards-container">
      <SelectionCard 
        v-for="ancestry in ancestries" 
        :key="ancestry.id" 
        :item="ancestry" 
        @select="selectAncestry(ancestry)"
      />
    </div>
  </div>
  
  <div class="ancestry-detail" v-else>
    <button class="close-button" @click="closeDetailView">🆇</button>
    <div class="ancestry-detail-content">
      <div class="image-carousel" @mouseenter="showNav = true" @mouseleave="showNav = false">
        <button v-if="showNav" class="nav-button left" @click="prevImage(selectedAncestry)">◀</button>
        <img :src="selectedAncestry.artUrls[currentImageIndex]" :alt="selectedAncestry.name" class="detail-image"/>
        <button v-if="showNav" class="nav-button right" @click="nextImage(selectedAncestry)">▶</button>
      </div>
      <div class="ancestry-info">
        <h2>{{ selectedAncestry.name }}</h2>
        <p>{{ selectedAncestry.description }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAncestriesStore } from '@/stores/ancestriesStore';
import { mapState } from 'pinia';
import SelectionCard from '@/components/SelectionCard.vue';

export default {
  components: {
    SelectionCard
  },
  data() {
    return {
      store: useAncestriesStore(),
      selectedAncestry: null,
      currentImageIndex: 0,
      showNav: false,
    };
  },
  computed: {
    ...mapState(useAncestriesStore, ['ancestries']),
  },
  methods: {
    selectAncestry(ancestry) {
      this.selectedAncestry = ancestry;
      this.currentImageIndex = 0;
    },
    closeDetailView() {
      this.selectedAncestry = null;
    },
    prevImage(ancestry) {
      this.currentImageIndex = (this.currentImageIndex - 1 + ancestry.artUrls.length) % ancestry.artUrls.length;
    },
    nextImage(ancestry) {
      this.currentImageIndex = (this.currentImageIndex + 1) % ancestry.artUrls.length;
    },
  },
  mounted() {
    this.store.fetchAncestries();
  },
};
</script>

<style scoped>
.ancestry-selection {
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

/* Detail view layout */
.ancestry-detail {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 90vw;
  max-width: 900px;
  height: 90vh;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  transform: translate(-50%, -50%);
  overflow-y: auto;
  padding: 1rem;
}

.ancestry-detail-content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 1rem;
  border-radius: 10px;
  color: white;
  justify-content: center;
  align-items: center;
}

/* Carousel image area */
.image-carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 1rem;
}

.detail-image {
  width: 300px;
  height: 300px;
  max-width: 80vw;
  max-height: 80vw;
  object-fit: cover;
  border-radius: 10px;
}

.ancestry-info {
  max-width: 400px;
  text-align: center;
  padding: 0 1rem;
}

/* Buttons */
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 30px;
  color: white;
  cursor: pointer;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 24px;
  padding: 5px 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-carousel:hover .nav-button {
  opacity: 1;
}

.nav-button.left {
  left: 10px;
  height: 50px;
}

.nav-button.right {
  right: 10px;
  height: 50px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .ancestry-detail-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ancestry-info {
    margin-left: 0;
    padding: 1rem 0;
  }

  .detail-image {
    width: 250px;
    height: 250px;
  }

  .nav-button {
    font-size: 20px;
    padding: 4px 8px;
  }
}
</style>
