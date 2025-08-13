<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Confirm Deletion</h2>
      <p>
        Type <strong>{{ name }}</strong> to confirm deletion:
      </p>
      <input type="text" v-model="confirmationInput" class="modal-input" placeholder="Type name to confirm" />
      <div>
        <ActionButton variant="danger" size="small" text="DELETE" :disabled="confirmationInput !== name"
          @click="confirmDeletion" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'

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
  z-index: var(--z-modal-content);
}

.modal-input {
  width: 90%;
  padding: 10px;
  margin: 10px 0;
  font-size: var(--font-size-16);
  background: var(--overlay-black-heavy);
  color: var(--color-text-primary);
}

.button:disabled {
  background: var(--overlay-black-heavy);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
</style>
