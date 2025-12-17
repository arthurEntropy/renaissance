<template>
    <div class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Invite-Only</h2>
                <button @click="closeModal" class="close-button" aria-label="Close">
                    <XMarkIcon class="close-icon" />
                </button>
            </div>

            <p class="message">
                Sorry, this game is invite-only at the moment. You can still browse the rules and
                other game concepts if you like, but you won't be able to create characters.
            </p>

            <p class="message">
                If you're interested in getting involved with playtesting, please get in touch. Thanks!
            </p>
        </div>
    </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['close'])

const closeModal = () => {
    emit('close')
}
</script>

<style scoped>
.modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    color: var(--color-primary);
    margin-bottom: 0;
    position: relative;
}

.modal-header h2 {
    flex: 1;
    text-align: center;
}

.close-button {
    position: absolute;
    right: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-xs);
    color: var(--color-gray-light);
    transition: color var(--duration-fast);
}

.close-button:hover {
    color: var(--color-white);
}

.close-icon {
    width: 24px;
    height: 24px;
}

.message {
    color: var(--color-text-primary);
    line-height: 1.6;
    margin-bottom: var(--space-lg);
    width: 80%;
}

.modal-content {
    width: 40vw;
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
