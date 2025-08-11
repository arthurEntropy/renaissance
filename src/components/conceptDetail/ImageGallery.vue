<template>
  <div class="image-gallery">
    <!-- Enlarged image section (only shown when images exist) -->
    <div v-if="images.length > 0" class="enlarged-image-wrapper" @mouseenter="showNav = true"
      @mouseleave="showNav = false">
      <button v-if="showNav && images.length > 1" class="nav-button left" @click.stop="prevImage"
        aria-label="Previous image">
        ◀
      </button>

      <img :src="images[selectedIndex]" :alt="`Image ${selectedIndex + 1}`" class="enlarged-image" />

      <!-- Edit button -->
      <button v-if="showNav && editable" class="edit-button" @click.stop="openEditModal" aria-label="Edit image">
        ✎
      </button>

      <button v-if="showNav && images.length > 1" class="nav-button right" @click.stop="nextImage"
        aria-label="Next image">
        ▶
      </button>

      <!-- Edit Modal - moved outside of conditional rendering -->
      <div v-if="editModalOpen" class="edit-modal" @click.stop>
        <div class="edit-modal-content">
          <h3>Edit Image</h3>
          <input type="text" v-model="editImageUrl" class="url-input" placeholder="Image URL" ref="editUrlInput" />
          <div class="edit-modal-buttons">
            <button class="button button-danger" @click.stop="deleteImage">
              Delete
            </button>
            <button class="button" @click.stop="closeEditModal">Cancel</button>
            <button class="button button-primary" @click.stop="saveImageUrl">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Thumbnails grid -->
    <div v-if="editable || images.length > 1" class="thumbs-container" :style="{ '--grid-columns': gridColumns }">
      <div class="thumbs-grid" :style="{ 'grid-template-columns': `repeat(${gridColumns}, 1fr)` }">
        <!-- Editable mode -->
        <template v-if="editable">
          <draggable v-model="localImages" class="draggable-container" handle=".thumb-drag-handle" item-key="idx"
            animation="150" ghost-class="ghost-thumb" @end="onDragEnd">
            <template #item="{ element: img, index: idx }">
              <div class="thumb-wrapper">
                <div class="thumb-drag-handle" title="Drag to reorder">⋮⋮</div>
                <img :src="img" :alt="`Thumbnail ${idx + 1}`" class="thumb-image" @click="selectImage(idx)" />
                <div v-if="selectedIndex === idx" class="thumb-selected-overlay"></div>
              </div>
            </template>
          </draggable>

          <!-- Add button in the same grid -->
          <div class="thumb-wrapper add-image-thumb" @click="addNewImage">
            <div class="add-image-placeholder">
              <span class="add-icon">+</span>
            </div>
          </div>
        </template>

        <!-- Non-editable mode -->
        <template v-else>
          <div v-for="(img, idx) in images" :key="img + idx" class="thumb-wrapper" @click="selectImage(idx)">
            <img :src="img" :alt="`Thumbnail ${idx + 1}`" class="thumb-image" />
            <div v-if="selectedIndex === idx" class="thumb-selected-overlay"></div>
          </div>
        </template>
      </div>
    </div>

    <!-- Add Image Modal (separate from edit modal, using global styles) -->
    <div v-if="addModalOpen" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <h3>Add New Image</h3>
        <input type="text" v-model="newImageUrl" class="modal-input" placeholder="Enter image URL" ref="addUrlInput" />
        <div class="modal-buttons">
          <button class="button" @click="closeAddModal">Cancel</button>
          <button class="button button-primary" @click="saveNewImage">
            Add Image
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'

// Props
const props = defineProps({
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
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:images', 'edit', 'delete', 'add'])

// Reactive state
const selectedIndex = ref(props.initialIndex)
const showNav = ref(false)
const editModalOpen = ref(false)
const addModalOpen = ref(false)
const editImageUrl = ref('')
const newImageUrl = ref('')
const localImages = ref([...props.images])
const isInternalChange = ref(false)

// Template refs
const editUrlInput = ref(null)
const addUrlInput = ref(null)

// Navigation methods
const selectImage = (idx) => {
  selectedIndex.value = idx
}

const prevImage = () => {
  selectedIndex.value =
    (selectedIndex.value - 1 + localImages.value.length) %
    localImages.value.length
}

const nextImage = () => {
  selectedIndex.value = (selectedIndex.value + 1) % localImages.value.length
}

// Edit existing image methods
const openEditModal = () => {
  editImageUrl.value = localImages.value[selectedIndex.value]
  editModalOpen.value = true
  // Focus the input field after the modal is rendered
  nextTick(() => {
    editUrlInput.value?.focus()
  })
}

const closeEditModal = () => {
  editModalOpen.value = false
  editImageUrl.value = ''
}

const saveImageUrl = () => {
  if (editImageUrl.value) {
    // Set the flag to indicate an internal change
    isInternalChange.value = true

    // Update existing image
    const updatedImages = [...localImages.value]
    updatedImages[selectedIndex.value] = editImageUrl.value

    // Update local copy
    localImages.value = updatedImages

    // Emit events
    emit('update:images', updatedImages)
    emit('edit', {
      index: selectedIndex.value,
      url: editImageUrl.value,
    })

    // Reset the flag after the next tick
    nextTick(() => {
      isInternalChange.value = false
    })
  }

  closeEditModal()
}

const deleteImage = () => {
  if (confirm('Are you sure you want to delete this image?')) {
    const indexToDelete = selectedIndex.value

    // Set the flag to indicate an internal change
    isInternalChange.value = true

    // Create a new array without the deleted image
    const updatedImages = localImages.value.filter(
      (_, idx) => idx !== indexToDelete,
    )

    // Adjust the selected index if necessary
    if (selectedIndex.value >= updatedImages.length) {
      selectedIndex.value = Math.max(0, updatedImages.length - 1)
    }

    // Update local copy
    localImages.value = updatedImages

    // Emit events
    emit('update:images', updatedImages)
    emit('delete', indexToDelete)

    // Reset the flag after the next tick
    nextTick(() => {
      isInternalChange.value = false
    })

    closeEditModal()
  }
}

// Add new image methods
const addNewImage = () => {
  newImageUrl.value = ''
  addModalOpen.value = true
  // Focus the input field after the modal is rendered
  nextTick(() => {
    addUrlInput.value?.focus()
  })
}

const closeAddModal = () => {
  addModalOpen.value = false
  newImageUrl.value = ''
}

const saveNewImage = () => {
  if (newImageUrl.value) {
    // Set the flag to indicate an internal change
    isInternalChange.value = true

    // Add new image to the array
    const updatedImages = [...localImages.value, newImageUrl.value]

    // Select the new image
    selectedIndex.value = updatedImages.length - 1

    // Update local copy
    localImages.value = updatedImages

    // Emit events
    emit('update:images', updatedImages)
    emit('add', newImageUrl.value)

    // Reset the flag after the next tick
    nextTick(() => {
      isInternalChange.value = false
    })
  }

  closeAddModal()
}

// Drag and drop method
const onDragEnd = () => {
  // Track the currently selected image URL before reordering
  const selectedImageUrl = localImages.value[selectedIndex.value]

  // Only emit if this is not already part of a recursive update
  if (!isInternalChange.value) {
    isInternalChange.value = true

    // Find the new index of the previously selected image
    const newSelectedIndex = localImages.value.findIndex(
      (url) => url === selectedImageUrl,
    )
    if (newSelectedIndex !== -1) {
      selectedIndex.value = newSelectedIndex
    }

    // Make a clean copy of the localImages array before emitting
    const cleanImages = [...localImages.value]

    // Use nextTick to ensure Vue's reactivity has settled
    nextTick(() => {
      // Emit the updated array
      emit('update:images', cleanImages)

      // Reset the flag after the update is processed
      isInternalChange.value = false
    })
  }
}

// Watchers
// Keep the watcher for external image changes
watch(() => props.images, (newImages) => {
  if (!isInternalChange.value) {
    if (JSON.stringify(newImages) !== JSON.stringify(localImages.value)) {
      localImages.value = [...newImages]

      if (selectedIndex.value >= newImages.length) {
        selectedIndex.value = Math.max(0, newImages.length - 1)
      }
    }
  }
}, { deep: true })
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
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.45);
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

.enlarged-image-wrapper:hover .nav-button {
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

.enlarged-image-wrapper:hover .edit-button {
  opacity: 1;
}

.edit-button:hover {
  background: rgba(0, 0, 0, 0.8);
}

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
  grid-template-columns: repeat(5, 1fr);
  /* Default, will be overridden */
  gap: 12px;
  width: 100%;
}

.thumb-wrapper {
  position: relative;
  cursor: pointer;
}

.draggable-container {
  display: contents;
  /* Makes draggable children part of parent grid */
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  background: #222;
  transition: box-shadow 0.2s;
}

.thumb-wrapper:hover .thumb-image {
  box-shadow: 0 2px 16px white;
}

.thumb-selected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 2px solid white;
  pointer-events: none;
}

/* Add image thumbnail */
.add-image-thumb {
  width: auto;
  min-width: auto;
  max-width: none;
  margin-top: 0;
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

/* Modal buttons styling */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

/* These styles will override the global modal styles */
:deep(.modal-content) {
  min-width: 350px;
}

:deep(.modal-input) {
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
}

/* Centered modal title */
:deep(.modal-content h3) {
  color: white;
  margin-bottom: 15px;
  text-align: center;
}

@media (max-width: 600px) {
  .thumbs-grid {
    grid-template-columns: repeat(2,
        1fr) !important;
    /* Responsive: 2 columns on small screens */
  }
}
</style>
