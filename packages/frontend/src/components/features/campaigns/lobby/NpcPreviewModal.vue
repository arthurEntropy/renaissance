<template>
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal modal--wide settings-modal npc-preview-modal">
            <div class="npc-preview-content">
                <CharacterProfile />
                <CharacterNotes :is-interactive="false" :show-full-content="true"
                    body-font-size="var(--font-size-14)" />
            </div>
            <div v-if="showViewCharacterSheet" class="modal-actions">
                <ActionButton variant="primary" size="small" @click="emit('view-character-sheet')">View Character Sheet
                </ActionButton>
            </div>
        </div>
    </div>
</template>

<script setup>
import CharacterProfile from '@/components/features/characterSheet/characterProfile/CharacterProfile.vue'
import CharacterNotes from '@/components/features/characterSheet/characterNotes/CharacterNotes.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

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
</script>

<style scoped>
@import './lobbyShared.css';

.npc-preview-modal {
    width: min(550px, 94vw);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

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
</style>
