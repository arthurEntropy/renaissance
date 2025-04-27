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
      
      <!-- Edit button -->
      <button
        v-if="showNav && editable"
        class="edit-button"
        @click.stop="openEditModal"
        aria-label="Edit image"
      >✎</button>
      
      <button
        v-if="showNav && images.length > 1"
        class="nav-button right"
        @click.stop="nextImage"
        aria-label="Next image"
      >▶</button>
      
      <!-- Edit Modal -->
      <div v-if="editModalOpen" class="edit-modal" @click.stop>
        <div class="edit-modal-content">
          <h3>Edit Image</h3>
          <input 
            type="text" 
            v-model="editImageUrl" 
            class="url-input" 
            placeholder="Image URL" 
            ref="urlInput"
          />
          <div class="edit-modal-buttons">
            <button class="button button-danger" @click.stop="deleteImage">Delete</button>
            <button class="button" @click.stop="closeEditModal">Cancel</button>
            <button class="button button-primary" @click.stop="saveImageUrl">Save</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="thumbs-container" :class="{ 'editable-thumbs': editable }">
      <!-- Draggable thumbnails grid -->
      <draggable
        v-if="editable"
        v-model="localImages"
        class="thumbs-grid"
        :style="{ 'grid-template-columns': `repeat(${gridColumns}, 1fr)` }"
        handle=".thumb-drag-handle"
        item-key="idx"
        animation="150"
        ghost-class="ghost-thumb"
        @end="onDragEnd"
      >
        <template #item="{element: img, index: idx}">
          <div class="thumb-wrapper">
            <div 
              class="thumb-drag-handle" 
              title="Drag to reorder"
            >
              ⋮⋮
            </div>
            <img
              :src="img"
              :alt="`Thumbnail ${idx + 1}`"
              class="thumb-image"
              @click="selectImage(idx)"
            />
            <div
              v-if="selectedIndex === idx"
              class="thumb-selected-overlay"
            ></div>
          </div>
        </template>
      </draggable>

      <!-- Regular thumbnails grid (non-editable mode) -->
      <div 
        v-else
        class="thumbs-grid"
        :style="{ 'grid-template-columns': `repeat(${gridColumns}, 1fr)` }"
      >
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
      
      <!-- Add New Image Thumbnail -->
      <div 
        v-if="editable" 
        class="thumb-wrapper add-image-thumb"
        @click="addNewImage"
      >
        <div class="add-image-placeholder">
          <span class="add-icon">+</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import draggable from 'vuedraggable';

export default defineComponent({
  name: "ImageGallery",
  components: {
    draggable
  },
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
    editable: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedIndex: this.initialIndex,
      showNav: false,
      editModalOpen: false,
      editImageUrl: '',
      localImages: [...this.images], // Local copy for draggable
      isInternalChange: false // Flag to prevent recursive updates
    };
  },
  emits: ['update:images', 'edit', 'delete', 'add'],
  methods: {
    selectImage(idx) {
      this.selectedIndex = idx;
    },
    prevImage() {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.localImages.length) % this.localImages.length;
    },
    nextImage() {
      this.selectedIndex = (this.selectedIndex + 1) % this.localImages.length;
    },
    openEditModal() {
      this.editImageUrl = this.localImages[this.selectedIndex];
      this.editModalOpen = true;
      // Focus the input field after the modal is rendered
      this.$nextTick(() => {
        this.$refs.urlInput?.focus();
      });
    },
    closeEditModal() {
      this.editModalOpen = false;
      this.editImageUrl = '';
    },
    saveImageUrl() {
      if (this.editImageUrl) {
        // Set the flag to indicate an internal change
        this.isInternalChange = true;
        
        // Create a new array to avoid direct mutation
        const updatedImages = [...this.localImages];
        updatedImages[this.selectedIndex] = this.editImageUrl;
        
        // Update local copy
        this.localImages = updatedImages;
        
        // Emit events
        this.$emit('update:images', updatedImages);
        this.$emit('edit', { index: this.selectedIndex, url: this.editImageUrl });
        
        // Reset the flag after the next tick
        this.$nextTick(() => {
          this.isInternalChange = false;
        });
      }
      this.closeEditModal();
    },
    deleteImage() {
      if (confirm('Are you sure you want to delete this image?')) {
        const indexToDelete = this.selectedIndex;
        
        // Set the flag to indicate an internal change
        this.isInternalChange = true;
        
        // Create a new array without the deleted image
        const updatedImages = this.localImages.filter((_, idx) => idx !== indexToDelete);
        
        // Adjust the selected index if necessary
        if (this.selectedIndex >= updatedImages.length) {
          this.selectedIndex = Math.max(0, updatedImages.length - 1);
        }
        
        // Update local copy
        this.localImages = updatedImages;
        
        // Emit events
        this.$emit('update:images', updatedImages);
        this.$emit('delete', indexToDelete);
        
        // Reset the flag after the next tick
        this.$nextTick(() => {
          this.isInternalChange = false;
        });
        
        this.closeEditModal();
      }
    },
    addNewImage() {
      this.editImageUrl = '';
      this.editModalOpen = true;
      // Focus the input field after the modal is rendered
      this.$nextTick(() => {
        this.$refs.urlInput?.focus();
      });
    },
    // Method to emit updates from drag and drop
    onDragEnd() {
      // Track the currently selected image URL before reordering
      const selectedImageUrl = this.localImages[this.selectedIndex];
      
      // Only emit if this is not already part of a recursive update
      if (!this.isInternalChange) {
        this.isInternalChange = true;
        
        // Find the new index of the previously selected image
        const newSelectedIndex = this.localImages.findIndex(url => url === selectedImageUrl);
        if (newSelectedIndex !== -1) {
          this.selectedIndex = newSelectedIndex;
        }
        
        // Make a clean copy of the localImages array before emitting
        const cleanImages = [...this.localImages];
        
        // Use nextTick to ensure Vue's reactivity has settled
        this.$nextTick(() => {
          // Emit the updated array
          this.$emit('update:images', cleanImages);
          
          // Reset the flag after the update is processed
          this.isInternalChange = false;
        });
      }
    }
  },
  watch: {
    images: {
      handler(newImages) {
        // Only update localImages if this is not from an internal change
        // and if the arrays are actually different
        if (!this.isInternalChange) {
          // Use a simple array comparison since these are just strings
          if (JSON.stringify(newImages) !== JSON.stringify(this.localImages)) {
            this.localImages = [...newImages];
            
            // Adjust selected index if needed
            if (this.selectedIndex >= newImages.length) {
              this.selectedIndex = Math.max(0, newImages.length - 1);
            }
          }
        }
      },
      deep: true
    }
  }
});
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

/* Edit button styling */
.edit-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.enlarged-image-wrapper:hover .edit-button { opacity: 1; }
.edit-button:hover { background: rgba(0, 0, 0, 0.8); }

/* Edit modal styling */
.edit-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.edit-modal-content {
  background: #222;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.edit-modal-content h3 {
  margin-top: 0;
  color: white;
  margin-bottom: 15px;
}

.url-input {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 15px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
  font-size: 16px;
}

.edit-modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: #444;
  color: white;
}

.button-primary {
  background-color: #4caf50;
}

.button-danger {
  background-color: #f44336;
}

/* Thumbnail grid */
.thumbs-container {
  position: relative;
  width: 100%;
}

.thumbs-grid {
  display: grid;
  gap: 12px;
  width: 100%;
}

.thumb-wrapper {
  position: relative;
  cursor: pointer;
}

/* Drag handle for editable mode */
.thumb-drag-handle {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 16px;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  padding: 2px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 3;
}

.thumb-wrapper:hover .thumb-drag-handle {
  opacity: 1;
}

.ghost-thumb {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed #777;
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
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 2px solid white;
  pointer-events: none;
}

/* Add image thumbnail */
.add-image-thumb {
  margin-top: 12px;
  width: calc(100% / var(--grid-columns, 5) - 12px);
  max-width: 100px;
  min-width: 80px;
}

.add-image-placeholder {
  width: 100%;
  aspect-ratio: 1/1;
  border: 2px dashed #555;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.add-image-thumb:hover .add-image-placeholder {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: #888;
}

.add-icon {
  font-size: 30px;
  color: #888;
}

/* Responsive design */
.editable-thumbs {
  display: flex;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .thumbs-grid {
      grid-template-columns: repeat(2, 1fr) !important; /* Responsive: 2 columns on small screens */
  }
}
</style>