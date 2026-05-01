<template>
    <div class="character-notes-wrapper">
        <CharacterSheetSection :custom-class="notesClass" :min-width="'250px'" @click="handleSectionClick">
            <div class="notes-header">NOTES</div>
            <div class="notes-content" :class="{ 'notes-content--full': showFullContent }">
                <div v-if="hasNotes" v-html="safeFormattedNotes" class="notes-preview"
                    :class="{ 'notes-preview--full': showFullContent }" :style="notesBodyStyle"></div>
                <p v-else class="notes-empty">{{ EMPTY_NOTES_MESSAGE }}</p>
            </div>
        </CharacterSheetSection>

        <!-- Notes / Bio Modal -->
        <div v-if="isInteractive && isModalOpen" class="modal-overlay" @click="handleOverlayClick">
            <div class="modal-content bio-modal edit-hover-area" @click.stop>
                <FloatingActionButton v-if="canEdit && !isEditMode" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ON_HOVER" class="edit-button-overlay" @click.stop="startEdit" />

                <div class="notes-header">NOTES</div>

                <!-- View Mode -->
                <div v-if="!isEditMode" class="full-text-content">
                    <div v-if="hasNotes" v-html="safeFormattedNotes" class="full-text"></div>
                    <p v-else class="empty-text">{{ EMPTY_NOTES_MESSAGE }}</p>
                </div>

                <!-- Edit Mode -->
                <template v-else>
                    <div class="modal-body">
                        <TextEditor v-model="editedContent" :auto-height="true" :placeholder="EMPTY_NOTES_MESSAGE"
                            height="300px" />
                    </div>
                    <div class="modal-footer">
                        <div class="form-buttons">
                            <ActionButton variant="success" size="small" text="Save" @click="saveChanges" />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useCharactersStore } from '@/stores/charactersStore'
import { useNotesModal } from '@/composables/useNotesModal'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'

const props = defineProps({
    isInteractive: {
        type: Boolean,
        default: true,
    },
    showFullContent: {
        type: Boolean,
        default: false,
    },
    bodyFontSize: {
        type: String,
        default: 'var(--font-size-11)',
    },
})

const EMPTY_NOTES_MESSAGE = "Add notes here..."

const charactersStore = useCharactersStore()
const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const { isModalOpen, openModal, closeModal } = useNotesModal()

// Edit state
const isEditMode = ref(false)
const editedContent = ref('')
const editedAge = ref(0)
const editedHeightFeet = ref(0)
const editedHeightInches = ref(0)
const editedWeight = ref(0)

// Reset edit mode whenever the modal closes
watch(isModalOpen, (val) => {
    if (!val) isEditMode.value = false
})

const hasNotes = computed(() => !!character.value?.notes)

const notesClass = computed(() => ({
    'character-notes': true,
    'character-notes--static': !props.isInteractive,
}))

const notesBodyStyle = computed(() => ({
    fontSize: props.bodyFontSize,
}))

const safeFormattedNotes = computed(() => {
    if (!hasNotes.value) return ''
    const html = marked.parse(character.value.notes, { breaks: true })
    return sanitizeHtml(html)
})

const hasUnsavedChanges = computed(() => {
    return (
        editedContent.value !== (character.value?.notes || '') ||
        editedAge.value !== (character.value?.age || 0) ||
        editedHeightFeet.value !== (character.value?.heightFeet || 0) ||
        editedHeightInches.value !== (character.value?.heightInches || 0) ||
        editedWeight.value !== (character.value?.weight || 0)
    )
})

const startEdit = () => {
    editedContent.value = character.value?.notes || ''
    editedAge.value = character.value?.age || 0
    editedHeightFeet.value = character.value?.heightFeet || 0
    editedHeightInches.value = character.value?.heightInches || 0
    editedWeight.value = character.value?.weight || 0
    isEditMode.value = true
}

const handleSectionClick = () => {
    if (!props.isInteractive) return
    openModal()
}

const handleOverlayClick = () => {
    if (isEditMode.value && hasUnsavedChanges.value) {
        const shouldDiscard = confirm('Discard unsaved changes?')
        if (shouldDiscard) closeModal()
    } else {
        closeModal()
    }
}

const saveChanges = () => {
    if (character.value) {
        character.value.notes = editedContent.value
        character.value.age = editedAge.value
        character.value.heightFeet = editedHeightFeet.value
        character.value.heightInches = editedHeightInches.value
        character.value.weight = editedWeight.value
        isEditMode.value = false
    }
}
</script>

<style scoped>
.character-notes {
    width: auto;
}

.character-notes-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
}

:deep(.character-notes) {
    cursor: pointer;
    height: 100%;
    flex-direction: column;
    gap: var(--space-sm);
}

:deep(.character-notes.character-notes--static) {
    cursor: default;
}

:deep(.character-notes:hover) {
    background-color: rgba(0, 0, 0, 0.85);
}

:deep(.character-notes.character-notes--static:hover) {
    background-color: inherit;
}

.notes-header {
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    text-transform: uppercase;
    flex-shrink: 0;
    text-align: left;
}

.notes-content {
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.notes-content--full {
    overflow: visible;
}

.notes-preview {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    line-height: var(--line-height-tight);
    overflow: hidden;
    display: -webkit-box;
    line-clamp: 13;
    -webkit-line-clamp: 13;
    -webkit-box-orient: vertical;
    word-break: break-word;
    margin: 0;
}

.notes-preview--full {
    display: block;
    overflow: visible;
    line-clamp: unset;
    -webkit-line-clamp: unset;
    -webkit-box-orient: initial;
}

.notes-preview :deep(p),
.notes-preview :deep(h1),
.notes-preview :deep(h2),
.notes-preview :deep(h3),
.notes-preview :deep(li) {
    font-size: inherit;
    color: var(--color-text-secondary);
    margin: 0;
    padding: 0;
}

.notes-preview :deep(ul),
.notes-preview :deep(ol) {
    font-size: inherit;
    color: var(--color-text-secondary);
    margin: 0;
    padding-left: var(--space-lg);
}

.notes-preview :deep(p + p),
.notes-preview :deep(p + ul),
.notes-preview :deep(p + ol),
.notes-preview :deep(ul + p),
.notes-preview :deep(ol + p) {
    margin-top: 0.25em;
}

.notes-empty {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0;
}

/* Modal styles */
.edit-button-overlay {
    position: absolute;
    z-index: var(--z-raised);
    top: var(--space-md);
    right: var(--space-md);
}

.bio-modal {
    width: var(--width-modal);
    max-height: 85%;
    min-height: 200px;
    padding: var(--space-xl);
    background: var(--overlay-black-heavy);
    border-radius: var(--radius-15);
    border: 1px solid var(--color-border-secondary);
    position: relative;
}

.full-text-content {
    margin-top: var(--space-md);
    overflow-y: auto;
    text-align: left;
}

.full-text {
    line-height: var(--line-height-normal);
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
}

.full-text :deep(p) {
    margin: 0 0 var(--space-md) 0;
}

.full-text :deep(p:last-child) {
    margin-bottom: 0;
}

.empty-text {
    color: var(--color-gray-light);
    font-style: italic;
    font-size: var(--font-size-16);
}

.modal-footer {
    margin-top: var(--space-md);
}

.form-buttons {
    display: flex;
    justify-content: flex-end;
}
</style>
