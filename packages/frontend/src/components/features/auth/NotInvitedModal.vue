<template>
    <div class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Invite-Only</h2>
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
const emit = defineEmits(['close'])

const closeModal = () => {
    emit('close')
}
</script>

<style scoped>
.modal-header {
    color: var(--color-primary);
    margin-bottom: 0;
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
