<template>
  <div class="ancestry-selection" v-if="!selectedAncestry">
    <h2>ANCESTRIES</h2>
    <div class="ancestry-selection-cards-section">
      <div class="ancestry-selection-card" v-for="ancestry in ancestries" :key="ancestry.id">
        <img :src="ancestry.artUrls[0]" :alt="ancestry.name" class="selection-image" @click="selectAncestry(ancestry)"/>
        <p class="ancestry-name">{{ ancestry.name }}</p>
      </div>
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

export default {
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

<style>
.ancestry-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  flex-grow: 1;
}
.ancestry-selection-cards-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 50px;
}
.ancestry-selection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
  padding: 10px;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
}
.selection-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  margin: 10px;
}
.ancestry-name {
  font-size: 20px;
  font-weight: normal;
  margin: 10px;
  max-width: 200px;
  text-align: center;
}

.ancestry-detail {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 80vw;
  height: 80vh;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  transform: translate(-50%, -50%);
}
.ancestry-detail-content {
  display: flex;
  padding: 20px;
  border-radius: 10px;
  color: white;
}
.image-carousel {
  display: flex;
  align-items: center;
  position: relative;
}
.detail-image {
  width: 400px;
  height: 400px;
  object-fit: cover;
}
.ancestry-info {
  margin-left: 20px;
  max-width: 400px;
}
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
}

.nav-button.right {
  right: 10px;
}
</style>