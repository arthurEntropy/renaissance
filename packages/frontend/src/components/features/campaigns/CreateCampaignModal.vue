<template>
    <BaseModal title="Create Campaign" :open="visible" width="min(500px, 94vw)" @close="emit('close')">
        <div class="form-field">
            <label class="form-label">Campaign Name *</label>
            <input v-model="createForm.name" class="modal-input" autofocus />
        </div>
        <div class="form-field">
            <label class="form-label">Description</label>
            <textarea v-model="createForm.description" class="modal-input form-textarea" rows="3" />
        </div>
        <div class="form-field">
            <label class="form-label">Cover Image URL</label>
            <input v-model="createForm.coverImageUrl" class="modal-input" placeholder="https://…" />
        </div>
        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <template #actions>
            <ActionButton variant="neutral" size="large" @click="emit('close')">Cancel</ActionButton>
            <ActionButton variant="primary" size="large" @click="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Creating…' : 'Create Campaign' }}
            </ActionButton>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    isSubmitting: {
        type: Boolean,
        default: false,
    },
    errorMessage: {
        type: String,
        default: '',
    },
})

const emit = defineEmits(['close', 'submit'])

const createForm = ref({ name: '', description: '', coverImageUrl: '' })

watch(
    () => props.visible,
    (isVisible) => {
        if (!isVisible) return
        createForm.value = { name: '', description: '', coverImageUrl: '' }
    }
)

const submit = () => {
    emit('submit', {
        name: createForm.value.name.trim(),
        description: createForm.value.description.trim(),
        coverImageUrl: createForm.value.coverImageUrl.trim() || null,
    })
}
</script>

<style scoped>
.form-field {
    display: flex;
    flex-direction: column;
}

.form-textarea {
    resize: vertical;
    min-height: 96px;
}

.form-error {
    font-size: var(--font-size-13);
    color: var(--color-danger);
    margin: 0;
}
</style>
