<template>
    <BaseModal :open="visible" hide-header width="min(550px, 94vw)" @close="emit('close')">
        <div class="npc-preview-content">
            <CharacterProfile :force-readonly="true" />
            <CharacterNotes :is-interactive="false" :show-full-content="true" body-font-size="var(--font-size-14)" />
        </div>
        <template v-if="showViewCharacterSheet" #actions>
            <ActionButton variant="primary" size="large" @click="emit('view-character-sheet')">View Character Sheet
            </ActionButton>
        </template>
    </BaseModal>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import CharacterProfile from '@/components/features/characterSheet/characterProfile/CharacterProfile.vue'
import CharacterNotes from '@/components/features/characterSheet/characterNotes/CharacterNotes.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'

defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    showViewCharacterSheet: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['close', 'view-character-sheet'])

const handleEscape = (e) => {
    if (e.key === 'Escape') emit('close')
}

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.npc-preview-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    align-items: stretch;
    width: 100%;
    min-width: 0;
}

.npc-preview-content :deep(.character-sheet-section) {
    width: 100%;
    min-width: 0 !important;
    box-sizing: border-box;
}

.npc-preview-content :deep(.character-profile) {
    min-width: 0 !important;
}

.npc-preview-content :deep(.character-notes.character-notes--static:hover) {
    background-color: var(--overlay-black-heavy);
}

/* Override BaseModal's generic input/select margin rules for the profile badges */
:deep(.bottom-badges select),
:deep(.bottom-badges input) {
    margin-top: 0;
    margin-bottom: 0;
    height: 100%;
}

:deep(.number-input-container) {
    margin-top: -8px;
}
</style>
