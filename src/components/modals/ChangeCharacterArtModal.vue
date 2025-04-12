<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <label for="imageUrl">Image URL:</label>
      <input
        type="text"
        v-model="tempArtUrl"
        id="imageUrl"
        class="url-input"
        placeholder="Enter image URL"
      />
      <button
        class="button button-primary"
        @click="saveArtUrl"
        :disabled="!isValidImageUrl(tempArtUrl)"
      >
        Save
      </button>
    </div>
  </div>
</template>

<script>
  import CharacterService from "@/services/CharacterService";

  export default {
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
    emits: ["close", "update-character"],
    data() {
      return {
        tempArtUrl: this.initialArtUrl,
      };
    },
    methods: {
      closeModal() {
        this.$emit("close");
      },
      saveArtUrl() {
        const updatedCharacter = { ...this.character };
        if (!updatedCharacter.artUrls) {
          updatedCharacter.artUrls = [];
        }
        updatedCharacter.artUrls[0] = this.tempArtUrl;
        CharacterService.saveCharacter(updatedCharacter);
        this.$emit("update-character", updatedCharacter);
        this.closeModal();
      },
      isValidImageUrl(url) {
        const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
        return urlPattern.test(url);
      },
    },
  };
</script>

<style scoped>
  .modal-content {
    width: 50%;
  }
  .url-input {
    width: 95%;
    padding: 10px;
    margin: 10px 0;
    font-size: 16px;
    color: lightgray;
    background: black;
    border: 1px solid gray;
    border-radius: 5px;
  }
  button:disabled {
    background-color: gray;
    cursor: not-allowed;
  }
</style>