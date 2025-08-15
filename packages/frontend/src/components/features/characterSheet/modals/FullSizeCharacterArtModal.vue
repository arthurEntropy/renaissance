<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="image-wrapper edit-hover-area">
        <img :src="imageUrl" class="modal-image" />
        <!-- Edit button positioned at top right -->
        <EditButton size="small" visibility="on-hover" class="edit-button-overlay" @click.stop="changeArt" />
      </div>
    </div>
  </div>
</template>

<script setup>
import EditButton from '@/components/ui/buttons/EditButton.vue'

defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'change-art'])

const closeModal = () => {
  emit('close')
}

const changeArt = () => {
  emit('change-art')
}
</script>

<style scoped>
.image-wrapper {
  position: relative;
  display: inline-block;
}

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  display: block;
}

/* Edit button overlay styling - matches ImageGallery */
.edit-button-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: var(--z-raised);
}
</style>
