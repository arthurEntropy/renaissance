<template>
    <div class="concept-detail" @click="closeDetailView">
      <button class="close-button" @click="closeDetailView">ⓧ</button>
      <button class="delete-button" @click="deleteConcept">🗑️</button>
      <div class="concept-detail-content">
        <div class="image-carousel" @mouseenter="showNav = true" @mouseleave="showNav = false">
          <button v-if="showNav" class="nav-button left" @click="prevImage">◀</button>
          <img :src="concept.artUrls[currentImageIndex]" :alt="concept.name" class="detail-image" />
          <button v-if="showNav" class="nav-button right" @click="nextImage">▶</button>
        </div>
        <div class="concept-info">
          <h2>{{ concept.name }}</h2>
          <p>{{ concept.description }}</p>
        </div>
      </div>
    </div>
</template>
  
  <script>
    export default {
        props: {
        concept: {
            type: Object,
            required: true,
        },
        },
        data() {
        return {
            currentImageIndex: 0,
            showNav: false,
        };
        },
        methods: {
        closeDetailView() {
            this.$emit('close');
        },
        deleteConcept() {
            this.$emit('delete', this.concept);
        },
        prevImage() {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.concept.artUrls.length) % this.concept.artUrls.length;
        },
        nextImage() {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.concept.artUrls.length;
        },
        },
    };
  </script>
  
  <style scoped>
    .concept-detail {
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
    
    .concept-detail-content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        padding: 1rem;
        border-radius: 10px;
        color: white;
        justify-content: center;
        align-items: center;
    }
    
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
    
    .concept-info {
        max-width: 400px;
        text-align: center;
        padding: 0 1rem;
    }
    
    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        color: gray;
        cursor: pointer;
    }

    .delete-button {
        position: absolute;
        top: 10px;
        left: 10px;
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
  </style>