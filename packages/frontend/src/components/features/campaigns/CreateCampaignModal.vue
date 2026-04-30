<template>
    <Teleport to="body">
        <div v-if="visible" class="modal-backdrop" @click.self="emit('close')">
            <div class="modal-box">
                <h2 class="modal-title">Create Campaign</h2>
                <div class="form-field">
                    <label class="form-label">Campaign Name *</label>
                    <input v-model="createForm.name" class="form-input" placeholder="The Shattered Realm" autofocus />
                </div>
                <div class="form-field">
                    <label class="form-label">Description</label>
                    <textarea v-model="createForm.description" class="form-input form-textarea"
                        placeholder="A brief summary of the campaign…" rows="3" />
                </div>
                <div class="form-field">
                    <label class="form-label">Cover Image URL</label>
                    <input v-model="createForm.coverImageUrl" class="form-input" placeholder="https://…" />
                </div>
                <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="emit('close')">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="submit" :disabled="isSubmitting">
                        {{ isSubmitting ? 'Creating…' : 'Create Campaign' }}
                    </ActionButton>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

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
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
}

.modal-box {
    background: var(--color-bg-primary);
    border-radius: var(--radius-10);
    border: 1px solid var(--overlay-white-medium);
    padding: var(--space-2xl);
    width: 100%;
    max-width: 480px;
    box-shadow: var(--shadow-elevation-md, var(--shadow-lg));
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.modal-title {
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.form-label {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
}

.form-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    box-sizing: border-box;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

.form-error {
    font-size: var(--font-size-13);
    color: var(--color-warning);
    margin: 0;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
}
</style>
