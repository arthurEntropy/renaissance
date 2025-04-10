<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <label for="imageUrl">Image URL:</label>
        <input
          type="text"
          v-model="tempArtUrl"
          id="imageUrl"
          class="modal-input"
          placeholder="Enter image URL"
        />
        <div class="modal-buttons">
          <button class="button" @click="closeModal">Cancel</button>
          <button class="button" @click="saveArtUrl" :disabled="!isValidImageUrl(tempArtUrl)">
            Save
          </button>
        </div>
      </div>
    </div>
</template>
  
<script>
  export default {
    props: {
      initialArtUrl: {
        type: String,
        required: true,
      },
    },
    emits: ['close', 'save'],
    data() {
      return {
        tempArtUrl: this.initialArtUrl,
      };
    },
    methods: {
      closeModal() {
        this.$emit('close');
      },
      saveArtUrl() {
        if (this.isValidImageUrl(this.tempArtUrl)) {
          this.$emit('save', this.tempArtUrl);
        }
      },
      isValidImageUrl(url) {
        const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
        return urlPattern.test(url);
      },
    },
  };
</script>
  
<style scoped>
/* Modal Content */
.modal-content {
  background: rgb(30, 30, 30);
  padding: 20px;
  border-radius: 8px;
  width: 50%;
  text-align: center;
}

/* Input Field */
.modal-input {
  width: 95%;
  padding: 10px;
  margin: 10px 0;
  font-size: 16px;
  color: lightgray;
  background: black;
  border: 1px solid gray;
  border-radius: 5px;
}

/* Buttons Container */
.modal-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* Button Styles */
button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  background-color: darkgray;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: gray;
}

button:disabled {
  background-color: lightgray;
  cursor: not-allowed;
}
</style>