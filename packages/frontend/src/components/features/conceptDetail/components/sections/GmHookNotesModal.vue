<template>
    <BaseModal :open="open" :title="hook?.name || ''" @close="emit('close')">
        <div class="gm-hook-notes-content">
            <div v-if="hook?.description" class="hook-section">
                <h3 class="section-label">Description</h3>
                <div class="section-body" v-html="sanitizeHtml(hook.description)"></div>
            </div>
            <div v-if="hook?.gmNotes" class="hook-section">
                <h3 class="section-label">GM Notes</h3>
                <div class="section-body gm-notes-body" v-html="sanitizeHtml(hook.gmNotes)"></div>
            </div>
            <p v-if="!hook?.description && !hook?.gmNotes" class="empty-hint">No notes available.</p>
        </div>
    </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

defineProps({
    open: {
        type: Boolean,
        default: false,
    },
    hook: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.gm-hook-notes-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.hook-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.section-label {
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin: 0;
}

.section-body {
    color: var(--color-text-primary);
    line-height: var(--line-height-normal);
    white-space: pre-line;
}

.gm-notes-body {
    padding: var(--space-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-5);
    font-style: italic;
    color: var(--color-text-secondary);
}

.empty-hint {
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
