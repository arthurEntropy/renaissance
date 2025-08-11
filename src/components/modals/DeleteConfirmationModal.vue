<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Confirm Deletion</h2>
      <p>
        Type <strong>{{ name }}</strong> to confirm deletion:
      </p>
      <input type="text" v-model="confirmationInput" class="modal-input" placeholder="Type name to confirm" />
      <div>
        <button class="button button-danger" :disabled="confirmationInput !== name" @click="confirmDeletion">
          DELETE
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  name: { type: String, required: true },
})

const emit = defineEmits(['close', 'confirm'])

const confirmationInput = ref('')

function closeModal() {
  emit('close')
}

function confirmDeletion() {
  emit('confirm')
}
</script>

<style scoped>
.modal-overlay {
  z-index: 1001;
}

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
