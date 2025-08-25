<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Character Settings</h2>

      <div v-if="!showDeleteConfirmation" class="settings-content">
        <p class="settings-description">Manage your character settings.</p>
        <ActionButton variant="danger" size="small" text="Delete Character" @click="initiateDelete" />
      </div>

      <div v-else class="delete-confirmation">
        <h3>Confirm Deletion</h3>
        <p class="confirmation-text">
          Type <strong>{{ characterName }}</strong> to confirm deletion:
        </p>
        <input v-model="confirmationInput" type="text" class="confirmation-input"
          placeholder="Type character name to confirm" @keyup.enter="confirmDeletion" />
        <div class="confirmation-actions">
          <ActionButton variant="secondary" size="small" text="Cancel" @click="cancelDelete" />
          <ActionButton variant="danger" size="small" text="DELETE" :disabled="!isDeleteConfirmed"
            @click="confirmDeletion" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
  characterName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'delete'])

const showDeleteConfirmation = ref(false)
const confirmationInput = ref('')

const isDeleteConfirmed = computed(() => {
  return confirmationInput.value === props.characterName
})

function closeModal() {
  emit('close')
}

function initiateDelete() {
  showDeleteConfirmation.value = true
}

function cancelDelete() {
  showDeleteConfirmation.value = false
  confirmationInput.value = ''
}

function confirmDeletion() {
  if (isDeleteConfirmed.value) {
    emit('delete')
  }
}
</script>

<style scoped>
.modal-overlay {
  z-index: var(--z-modal-content);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  align-items: center;
}

.settings-description {
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}

.delete-confirmation {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  align-items: center;
}

.delete-confirmation h3 {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-18);
}

.confirmation-text {
  text-align: center;
  color: var(--color-text-primary);
  margin: 0;
}

.confirmation-input {
  width: 100%;
  max-width: 280px;
  padding: var(--space-md);
  font-size: var(--font-size-16);
  background: var(--overlay-black-heavy);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-3);
  text-align: center;
}

.confirmation-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--overlay-primary-subtle);
}

.confirmation-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
}
</style>
