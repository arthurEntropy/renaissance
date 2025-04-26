<template>
    <div class="image-gallery">
      <div
        class="enlarged-image-wrapper"
        @mouseenter="showNav = true"
        @mouseleave="showNav = false"
      >
        <button
          v-if="showNav && images.length > 1"
          class="nav-button left"
          @click.stop="prevImage"
          aria-label="Previous image"
        >◀</button>
        <img
          :src="images[selectedIndex]"
          :alt="`Image ${selectedIndex + 1}`"
          class="enlarged-image"
        />
        <button
          v-if="showNav && images.length > 1"
          class="nav-button right"
          @click.stop="nextImage"
          aria-label="Next image"
        >▶</button>
      </div>
      <div class="thumbs-grid">
        <div
          v-for="(img, idx) in images"
          :key="img + idx"
          class="thumb-wrapper"
          @click="selectImage(idx)"
        >
          <img
            :src="img"
            :alt="`Thumbnail ${idx + 1}`"
            class="thumb-image"
          />
          <div
            v-if="selectedIndex === idx"
            class="thumb-selected-overlay"
          ></div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "ImageGallery",
    props: {
      images: {
        type: Array,
        required: true,
      },
      initialIndex: {
        type: Number,
        default: 0,
      },
      gridColumns: {
        type: Number,
        default: 5,
      },
    },
    data() {
      return {
        selectedIndex: this.initialIndex,
        showNav: false,
      };
    },
    methods: {
      selectImage(idx) {
        this.selectedIndex = idx;
      },
      prevImage() {
        this.selectedIndex =
          (this.selectedIndex - 1 + this.images.length) % this.images.length;
      },
      nextImage() {
        this.selectedIndex = (this.selectedIndex + 1) % this.images.length;
      },
    },
    watch: {
      images(newImages) {
        if (this.selectedIndex >= newImages.length) {
          this.selectedIndex = 0;
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .image-gallery {
    width: 100%;
  }
  .enlarged-image-wrapper {
    width: 100%;
    margin-bottom: 1rem;
    position: relative;
  }
  .enlarged-image {
    width: 100%;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.45);
    background: #111;
    display: block;
    margin: 0 auto;
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
    z-index: 2;
  }
  .enlarged-image-wrapper:hover .nav-button { opacity: 1; }
  .nav-button.left { left: 10px; height: 50px; }
  .nav-button.right { right: 10px; height: 50px; }
  
  .thumbs-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* Always 5 columns */
    gap: 12px;
    width: 100%;
    }
  .thumb-wrapper {
    position: relative;
    cursor: pointer;
  }
  .thumb-image {
    width: 100%;
    aspect-ratio: 1/1;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    background: #222;
    transition: box-shadow 0.2s;
  }
  .thumb-wrapper:hover .thumb-image {
    box-shadow: 0 2px 16px white;
  }
  .thumb-selected-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    border: 2px solid white;
    pointer-events: none;
  }
  @media (max-width: 600px) {
    .thumbs-grid {
        grid-template-columns: repeat(2, 1fr); /* Responsive: 2 columns on small screens */
    }
  }
  </style>