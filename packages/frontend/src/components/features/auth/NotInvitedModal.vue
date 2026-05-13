<template>
    <BaseModal title="Invite-Only" @close="emit('close')">
        <p class="message">
            Sorry, this game is invite-only at the moment. You can still browse the rules and
            other game concepts if you like, but you won't be able to create characters.
        </p>

        <p class="message">
            If you're interested in getting involved with playtesting, please get in touch. Thanks!
        </p>
    </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/ui/modals/BaseModal.vue'

const emit = defineEmits(['close'])
</script>

<style scoped>
.message {
    color: var(--color-text-primary);
    line-height: 1.6;
    margin-bottom: var(--space-lg);
    text-align: center;
}
</style>
