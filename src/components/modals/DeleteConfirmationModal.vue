<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Confirm Deletion</h2>
      <p>Type <strong>{{ name }}</strong> to confirm deletion:</p>
      <input
        type="text"
        v-model="confirmationInput"
        class="modal-input"
        placeholder="Type name to confirm"
      />
      <div>
        <button
          class="button button-danger"
          :disabled="confirmationInput !== name"
          @click="confirmDeletion"
        >
          DELETE
        </button>
      </div>
    </div>
  </div>
</template>
  
<script>
  export default {
    props: {
      name: {
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
    .button:disabled {
        background: black;
        color: darkgray;
        cursor: not-allowed;
    }
</style>