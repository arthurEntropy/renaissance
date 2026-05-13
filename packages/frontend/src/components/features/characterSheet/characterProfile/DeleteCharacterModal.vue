<template>
    <BaseModal title="Delete Character" :open="true" @close="emit('close')">
        <div class="delete-body">
            <p class="delete-description">
                This action cannot be undone. Type <strong>{{ character.name }}</strong> to confirm deletion:
            </p>
            <input v-model="confirmationInput" type="text" class="modal-input confirmation-input"
                placeholder="Type character name to confirm" @keyup.enter="confirmDeletion" />
        </div>
        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton variant="danger" size="large" text="DELETE" :disabled="!isDeleteConfirmed"
                @click="confirmDeletion" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close', 'deleted'])

const charactersStore = useCharactersStore()
const confirmationInput = ref('')

const isDeleteConfirmed = computed(() => confirmationInput.value === props.character.name)

const confirmDeletion = async () => {
    if (!isDeleteConfirmed.value || !props.character) return
    await charactersStore.deleteCharacter(props.character._id)
    emit('deleted')
}
</script>

<style scoped>
.delete-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
}

.delete-description {
    margin: 0;
    color: var(--color-text-primary);
    text-align: center;
}

.confirmation-input {
    text-align: center;
    width: 100%;
}
</style>
