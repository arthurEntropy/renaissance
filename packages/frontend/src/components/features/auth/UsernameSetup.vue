<template>
    <div class="modal-overlay" @click.self="handleBackgroundClick">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Choose Your Username</h2>
            </div>

            <form @submit.prevent="handleSubmit" class="username-form">
                <input id="username" v-model="username" type="text" placeholder="Enter username" class="modal-input"
                    :class="{ 'error': error }" @input="clearError" maxlength="20" pattern="[a-zA-Z0-9_]+" required />
                <span v-if="error" class="error-text">{{ error }}</span>

                <div class="form-buttons">
                    <ActionButton type="submit" variant="primary" :disabled="submitting">
                        {{ submitting ? 'Saving...' : 'Continue' }}
                    </ActionButton>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const authStore = useAuthStore()
const username = ref('')
const error = ref('')
const submitting = ref(false)

const clearError = () => {
    error.value = ''
}

const validateUsername = (value) => {
    if (value.length < 3) {
        return 'Username must be at least 3 characters'
    }
    if (value.length > 20) {
        return 'Username must be 20 characters or less'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores'
    }
    return null
}

const handleSubmit = async () => {
    error.value = ''

    const validationError = validateUsername(username.value)
    if (validationError) {
        error.value = validationError
        return
    }

    try {
        submitting.value = true
        await authStore.setUsername(username.value)
    } catch (err) {
        error.value = err.message || 'Failed to set username'
    } finally {
        submitting.value = false
    }
}

// Username modal should not close on background click since it's required
const handleBackgroundClick = () => {
    // Do nothing - username is required
}
</script>

<style scoped>
.username-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.modal-input {
    margin-left: 0;
    margin-right: 0;
}

.modal-input.error {
    border-color: var(--color-danger);
}

.error-text {
    font-size: var(--font-size-12);
    color: var(--color-danger);
    text-align: left;
}
</style>
