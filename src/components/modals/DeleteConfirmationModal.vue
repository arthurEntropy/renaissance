<!-- filepath: /src/components/modals/DeleteConfirmationModal.vue -->
<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>Confirm Deletion</h2>
        <p>Type the character's name (<strong>{{ characterName }}</strong>) to confirm deletion:</p>
        <input
          type="text"
          v-model="confirmationInput"
          class="modal-input"
          placeholder="Enter character name"
        />
        <div>
          <button class="button" @click="closeModal">Cancel</button>
          <button
            class="button confirm-delete-button"
            :disabled="confirmationInput !== characterName"
            @click="confirmDeletion"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      characterName: {
        type: String,
        required: true,
      },
    },
    emits: ['close', 'confirm'],
    data() {
      return {
        confirmationInput: '',
      };
    },
    methods: {
      closeModal() {
        this.$emit('close');
      },
      confirmDeletion() {
        this.$emit('confirm');
      },
    },
  };
  </script>
  
  <style scoped>
    .modal-input {
        width: 90%;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        background: black;
        color: white;
    }
    .confirm-delete-button {
        background: red;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    .confirm-delete-button:disabled {
        background: black;
        color: darkgray;
        cursor: not-allowed;
    }
</style>