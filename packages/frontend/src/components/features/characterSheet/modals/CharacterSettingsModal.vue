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
          Type <strong>{{ character.name }}</strong> to confirm deletion:
        </p>
        <input v-model="confirmationInput" type="text" class="modal-input confirmation-input"
          placeholder="Type character name to confirm" @keyup.enter="confirmDeletion" />
        <div class="confirmation-actions">
          <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelDelete" />
          <ActionButton variant="danger" size="small" text="DELETE" :disabled="!isDeleteConfirmed"
            @click="confirmDeletion" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const charactersStore = useCharactersStore()

const emit = defineEmits(['close', 'delete'])

const character = computed(() => charactersStore.selectedCharacter)

const showDeleteConfirmation = ref(false)
const confirmationInput = ref('')

const isDeleteConfirmed = computed(() => {
  return confirmationInput.value === character.value?.name
})

const closeModal = () => {
  emit('close')
}

const initiateDelete = () => {
  showDeleteConfirmation.value = true
}

const cancelDelete = () => {
  showDeleteConfirmation.value = false
  confirmationInput.value = ''
}

const confirmDeletion = () => {
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
  text-align: center;
}

.confirmation-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
}
</style>
