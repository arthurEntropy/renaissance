<template>
    <BaseModal :open="state.open" :title="state.title" width="360px"
        :overlay-style="{ zIndex: 'var(--z-modal-nested)' }" @close="_settle(false)">
        <p class="confirm-modal-message">{{ state.message }}</p>
        <template #actions>
            <ActionButton variant="neutral" :text="state.cancelLabel" @click="_settle(false)" />
            <ActionButton variant="primary" :text="state.confirmLabel" @click="_settle(true)" />
        </template>
    </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useConfirm } from '@/composables/useConfirm'

const { state, _settle } = useConfirm()
</script>

<style scoped>
.confirm-modal-message {
    text-align: center;
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    line-height: var(--line-height-normal);
    padding: var(--space-md) 0;
    margin: 0;
}
</style>
