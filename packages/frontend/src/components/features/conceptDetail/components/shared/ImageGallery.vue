<template>
  <div class="image-gallery">

    <!-- Main image with navigation controls and edit button -->
    <div v-if="displayImages.length > 0" class="enlarged-image-wrapper edit-hover-area" @mouseenter="showNav = true"
      @mouseleave="showNav = false">

      <!-- Navigation button - previous image -->
      <button v-if="showNav && displayImages.length > 1" class="nav-button left" @click.stop="prevImage"
        aria-label="Previous image">
        <ChevronLeftIcon class="nav-icon" />
      </button>

      <!-- Image -->
      <img :src="displayImages[selectedIndex]" :alt="`Image ${selectedIndex + 1}`" class="enlarged-image" />

      <!-- Edit button - only in manual mode -->
      <FloatingActionButton v-if="editable && mode === IMAGE_GALLERY_MODES.MANUAL" type="edit" size="small"
        visibility="on-hover" class="edit-button-overlay" @click.stop="openEditModal" />

      <!-- Navigation button - next image -->
      <button v-if="showNav && displayImages.length > 1" class="nav-button right" @click.stop="nextImage"
        aria-label="Next image">
        <ChevronRightIcon class="nav-icon" />
      </button>
    </div>

    <!-- Thumbnails grid -->
    <div v-if="(editable && mode === IMAGE_GALLERY_MODES.MANUAL) || displayImages.length > 1" class="thumbs-container">
      <div class="thumbs-grid">

        <!-- Editable mode -->
        <template v-if="editable && mode === IMAGE_GALLERY_MODES.MANUAL">

          <!-- Draggable thumbnails -->
          <draggable v-model="localImages" class="draggable-container" handle=".thumb-drag-handle" item-key="index"
            animation="150" ghost-class="ghost-thumb" @end="onDragEnd">
            <template #item="{ element: img, index }">
              <div class="thumb-wrapper">
                <FloatingActionButton type="drag" size="small" visibility="on-hover" class="thumb-drag-handle" />
                <img :src="img" :alt="`Thumbnail ${index + 1}`" class="thumb-image" @click="selectImage(index)" />
                <div v-if="selectedIndex === index" class="thumb-selected-overlay"></div>
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

        <!-- Non-editable mode or auto mode -->
        <template v-else>

          <!-- Thumbnails -->
          <div v-for="(img, index) in displayImages" :key="img + index" class="thumb-wrapper"
            @click="selectImage(index)">
            <img :src="img" :alt="`Thumbnail ${index + 1}`" class="thumb-image" />
            <div v-if="selectedIndex === index" class="thumb-selected-overlay"></div>
          </div>

        </template>
      </div>
    </div>

    <!-- Add Image Modal -->
    <div v-if="addModalOpen" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <h3>Add New Image</h3>
        <input type="text" v-model="newImageUrl" class="modal-input" placeholder="Enter image URL" ref="addUrlInput" />
        <div class="modal-buttons">
          <ActionButton variant="neutral" size="small" text="Cancel" @click="closeAddModal" />
          <ActionButton variant="primary" size="small" text="Add Image" @click="saveNewImage" />
        </div>
      </div>
    </div>

    <!-- Edit Image Modal -->
    <div v-if="editModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <h3>Edit Image</h3>
        <input type="text" v-model="editImageUrl" class="modal-input" placeholder="Enter image URL"
          ref="editUrlInput" />
        <div class="modal-buttons">
          <ActionButton variant="danger" size="small" text="Delete" @click="deleteImage" />
          <ActionButton variant="neutral" size="small" text="Cancel" @click="closeEditModal" />
          <ActionButton variant="success" size="small" text="Save" @click="saveImageUrl" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import draggable from 'vuedraggable'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useArtStore } from '@/stores/artStore'
import { IMAGE_GALLERY_MODES, ART_TYPES } from '@shared/constants/artConstants.js'

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: IMAGE_GALLERY_MODES.MANUAL,
    validator: (value) => Object.values(IMAGE_GALLERY_MODES).includes(value)
  },
  autoSourceType: {
    type: String,
    default: ART_TYPES.FACES,
    validator: (value) => Object.values(ART_TYPES).includes(value)
  },
  autoSourceId: {
    type: String,
    default: null
  },
  excludeUrls: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:images'])

// Stores
const artStore = useArtStore()

// If auto mode, compute images from art store; else use provided images
const displayImages = computed(() => {
  if (props.mode === IMAGE_GALLERY_MODES.AUTO && props.autoSourceId) {
    const autoImages = artStore.getByTypeAndSource(props.autoSourceType, props.autoSourceId)
    return autoImages.map(item => item.url).filter(url => !props.excludeUrls.includes(url))
  }
  return props.images
})

// Reactive state
const selectedIndex = ref(0)
const showNav = ref(false)
const editModalOpen = ref(false)
const addModalOpen = ref(false)
const editImageUrl = ref('')
const newImageUrl = ref('')
const localImages = ref([...props.images])

// Template refs
const editUrlInput = ref(null)
const addUrlInput = ref(null)

// Navigation methods
const selectImage = (index) => {
  selectedIndex.value = index
}

const prevImage = () => {
  selectedIndex.value =
    (selectedIndex.value - 1 + displayImages.value.length) %
    displayImages.value.length
}

const nextImage = () => {
  selectedIndex.value = (selectedIndex.value + 1) % displayImages.value.length
}

const openEditModal = () => {
  editImageUrl.value = localImages.value[selectedIndex.value]
  editModalOpen.value = true
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
    const updatedImages = [...localImages.value]
    updatedImages[selectedIndex.value] = editImageUrl.value
    localImages.value = updatedImages
    emit('update:images', updatedImages)
  }
  closeEditModal()
}

const deleteImage = () => {
  if (confirm('Are you sure you want to delete this image?')) {
    const indexToDelete = selectedIndex.value
    const updatedImages = localImages.value.filter((_, index) => index !== indexToDelete)

    if (selectedIndex.value >= updatedImages.length) {
      selectedIndex.value = Math.max(0, updatedImages.length - 1)
    }

    localImages.value = updatedImages
    emit('update:images', updatedImages)
    closeEditModal()
  }
}

const addNewImage = () => {
  newImageUrl.value = ''
  addModalOpen.value = true
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
    const updatedImages = [...localImages.value, newImageUrl.value]
    selectedIndex.value = updatedImages.length - 1
    localImages.value = updatedImages
    emit('update:images', updatedImages)
  }
  closeAddModal()
}

const onDragEnd = () => {
  const selectedImageUrl = localImages.value[selectedIndex.value]
  const newSelectedIndex = localImages.value.findIndex(url => url === selectedImageUrl)

  if (newSelectedIndex !== -1) {
    selectedIndex.value = newSelectedIndex
  }

  emit('update:images', [...localImages.value])
}

// Watcher for external image changes
watch(() => props.images, (newImages) => {
  // Simple array comparison - if lengths differ or any URL differs, update
  if (newImages.length !== localImages.value.length ||
    newImages.some((url, i) => url !== localImages.value[i])) {
    localImages.value = [...newImages]

    if (selectedIndex.value >= newImages.length) {
      selectedIndex.value = Math.max(0, newImages.length - 1)
    }
  }
})
</script>
<style scoped>
.enlarged-image-wrapper {
  width: 100%;
  margin-bottom: 1rem;
  position: relative;
}

.enlarged-image {
  width: 100%;
  object-fit: contain;
  border-radius: var(--radius-10);
  background: var(--color-bg-tertiary);
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--overlay-black-medium);
  border: none;
  color: var(--color-white);
  border-radius: var(--radius-full);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-normal);
  z-index: var(--z-raised);
}

.nav-button:hover {
  background: var(--overlay-black-heavy);
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.enlarged-image-wrapper:hover .nav-button {
  opacity: 1;
}

.nav-button.left {
  left: var(--space-xs);
}

.nav-button.right {
  right: var(--space-xs);
}

.edit-button-overlay {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  z-index: var(--z-raised);
}

.thumbs-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-xs);
  padding: var(--space-xs);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
}

.thumb-wrapper {
  position: relative;
  cursor: pointer;
}

.draggable-container {
  display: contents;
}

.thumb-drag-handle {
  position: absolute;
  top: var(--space-xs);
  left: var(--space-xs);
  z-index: var(--z-floating);
}

.ghost-thumb {
  opacity: 0.5;
  background: var(--overlay-white-subtle);
  border: var(--border-width-md) dashed var(--color-gray-medium);
}

.thumb-image {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: var(--radius-10);
  box-shadow: var(--shadow-elevation-sm);
  background: var(--color-bg-secondary);
  transition: box-shadow var(--transition-normal);
}

.thumb-selected-overlay {
  position: absolute;
  inset: 0;
  background: var(--overlay-white-medium);
  border-radius: var(--radius-10);
  border: 2px solid var(--color-gray-light);
  pointer-events: none;
}

.add-image-placeholder {
  width: 100%;
  aspect-ratio: 1/1;
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-border-secondary);
  border-radius: var(--radius-10);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-all);
}

.add-image-thumb:hover .add-image-placeholder {
  background: var(--overlay-white-subtle);
  border-color: var(--color-white);
}

.add-icon {
  font-size: var(--font-size-32);
  font-weight: var(--font-weight-light);
  color: var(--color-gray-light);
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

.modal-content {
  width: 30vw;
  min-width: 400px;
}

@media (max-width: var(--breakpoint-sm)) {
  .thumbs-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
