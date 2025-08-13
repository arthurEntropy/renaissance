<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <label for="imageUrl">Image URL:</label>
      <input type="text" v-model="tempArtUrl" id="imageUrl" class="url-input" placeholder="Enter image URL" />
      <ActionButton variant="success" size="small" text="Save" @click="saveArtUrl"
        :disabled="!isValidImageUrl(tempArtUrl)" />
    </div>
  </div>
</template>

<script>
import CharacterService from '@/services/CharacterService'
import ActionButton from '@/components/ActionButton.vue'

export default {
  components: {
    ActionButton
  },
  props: {
    initialArtUrl: {
      type: String,
      required: true,
    },
    character: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'update-character'],
  data() {
    return {
      tempArtUrl: this.initialArtUrl,
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    saveArtUrl() {
      const updatedCharacter = { ...this.character }
      if (!updatedCharacter.artUrls) {
        updatedCharacter.artUrls = []
      }
      updatedCharacter.artUrls[0] = this.tempArtUrl
      CharacterService.saveCharacter(updatedCharacter)
      this.$emit('update-character', updatedCharacter)
      this.closeModal()
    },
    isValidImageUrl(url) {
      const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i
      return urlPattern.test(url)
    },
  },
}
</script>

<style scoped>
.modal-content {
  width: 50%;
}

.url-input {
  width: 95%;
  padding: 10px;
  margin: 10px 0;
  font-size: var(--font-size-16);
  color: var(--color-text-secondary);
  background: var(--overlay-black-heavy);
  border: 1px solid var(--color-gray-medium);
  border-radius: 5px;
}

button:disabled {
  background-color: var(--color-gray-medium);
  cursor: not-allowed;
}
</style>
