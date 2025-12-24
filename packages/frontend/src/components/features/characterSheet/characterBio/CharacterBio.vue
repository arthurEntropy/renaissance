<template>
    <CharacterSheetSection min-width="200px" :style="{ flex: '1 1 auto' }">

        <!-- In-Sheet Bio Display -->
        <div class="bio-content edit-hover-area" @click="openModal">
            <FloatingActionButton v-if="canEdit" type="edit" size="small" visibility="on-hover"
                class="edit-button-overlay-small" @click.stop="openModalInEditMode" />
            <div v-if="hasBio" v-html="safeFormattedBio" class="bio-text"></div>
            <span v-else class="empty-bio">{{ EMPTY_BIO_MESSAGE }}</span>
        </div>

        <!-- Bio Modal (View/Edit) -->
        <div v-if="isModalOpen" class="modal-overlay" @click="handleOverlayClick">
            <div class="modal-content bio-modal edit-hover-area" @click.stop>
                <FloatingActionButton v-if="canEdit && !isEditMode" type="edit" size="small" visibility="on-hover"
                    class="edit-button-overlay" @click.stop="startEdit" />

                <!-- View Mode -->
                <div v-if="!isEditMode" class="full-text-content">
                    <div v-if="hasBio" v-html="safeFormattedBio" class="full-text"></div>
                    <p v-else class="empty-text">{{ EMPTY_BIO_MESSAGE }}</p>
                </div>

                <!-- Edit Mode -->
                <template v-else>
                    <div class="modal-body">
                        <TextEditor v-model="editedContent" :auto-height="true" :placeholder="EMPTY_BIO_MESSAGE"
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
    </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useCharactersStore } from '@/stores/charactersStore'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'

const charactersStore = useCharactersStore()

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const EMPTY_BIO_MESSAGE = "What's your vibe? What's your story? Where are you going?"

const hasBio = computed(() => !!character.value?.personalityAndBackground)

const isModalOpen = ref(false)
const isEditMode = ref(false)
const editedContent = ref('')

const safeFormattedBio = computed(() => {
    if (!hasBio.value) return ''
    const html = marked.parse(character.value.personalityAndBackground, { breaks: true })
    return sanitizeHtml(html)
})

const hasUnsavedChanges = computed(() => {
    return editedContent.value !== (character.value?.personalityAndBackground || '')
})

const openModal = () => {
    isModalOpen.value = true
    isEditMode.value = false
}

const openModalInEditMode = () => {
    editedContent.value = character.value?.personalityAndBackground || ''
    isModalOpen.value = true
    isEditMode.value = true
}

const startEdit = () => {
    editedContent.value = character.value?.personalityAndBackground || ''
    isEditMode.value = true
}

const closeModal = () => {
    isModalOpen.value = false
    isEditMode.value = false
}

const handleOverlayClick = () => {
    if (isEditMode.value && hasUnsavedChanges.value) {
        const shouldDiscard = confirm('Discard unsaved changes?')
        if (shouldDiscard) {
            closeModal()
        }
    } else {
        closeModal()
    }
}

const saveChanges = () => {
    if (character.value) {
        character.value.personalityAndBackground = editedContent.value
        isEditMode.value = false
    }
}
</script>
<style scoped>
.bio-content {
    position: relative;
    background-color: var(--color-dark-gray);
    border-radius: var(--radius-5);
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    font-size: var(--font-size-12);
    cursor: pointer;
    transition: var(--transition-background);
    overflow-y: auto;
    text-align: left;
}

.bio-text {
    line-height: var(--line-height-normal);
    display: -webkit-box;
    -webkit-line-clamp: 10;
    line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bio-text :deep(p),
.full-text :deep(p) {
    margin: 0 0 var(--space-md) 0;
}

.bio-text :deep(p:last-child),
.full-text :deep(p:last-child) {
    margin-bottom: 0;
}

.empty-bio,
.empty-text {
    color: var(--color-gray-light);
    font-style: italic;
}

.empty-text {
    font-size: var(--font-size-16);
}

.edit-button-overlay-small,
.edit-button-overlay {
    position: absolute;
    z-index: var(--z-raised);
    top: 0;
    right: 0;
}

.edit-button-overlay {
    top: var(--space-md);
    right: var(--space-md);
}

.bio-modal {
    max-width: var(--width-modal);
    max-height: 90%;
    padding: var(--space-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    position: relative;
}

.full-text-content {
    max-height: 80vh;
    overflow-y: auto;
    text-align: left;
}

.full-text-content h2 {
    margin-top: 0;
    margin-bottom: var(--space-lg);
    color: var(--color-white);
    font-size: var(--font-size-24);
}

.full-text {
    line-height: var(--line-height-normal);
    font-size: var(--font-size-16);
    color: var(--color-white);
}
</style>
