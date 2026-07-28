<template>
    <BaseModal title="Convert to Player Character" :open="true" @close="emit('close')">
        <div class="convert-body">
            <p class="convert-description">This character will become a Player Character.</p>
        </div>
        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton variant="primary" size="large" text="Confirm" @click="emit('confirm')" />
        </template>
    </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const emit = defineEmits(['close', 'confirm'])
</script>

<style scoped>
.convert-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
}

.convert-description {
    margin: 0;
    color: var(--color-text-primary);
    text-align: center;
}
</style>
