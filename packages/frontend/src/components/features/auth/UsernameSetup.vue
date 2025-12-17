<template>
    <div class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Choose Your Username</h2>
            </div>

            <form @submit.prevent="handleSubmit" class="username-form">
                <input id="username" v-model="username" type="text" placeholder="Enter username" class="modal-input"
                    :class="{ 'error': error }" @input="clearError" maxlength="20" :pattern="USERNAME_PATTERN_STRING"
                    required />
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
import { useUserStore } from '@/stores/userStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/
const USERNAME_PATTERN_STRING = '[a-zA-Z0-9_]+'

const userStore = useUserStore()
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
    if (!USERNAME_PATTERN.test(value)) {
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
        await userStore.update({ name: username.value })
    } catch (err) {
        error.value = err.message || 'Failed to set username'
    } finally {
        submitting.value = false
    }
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
