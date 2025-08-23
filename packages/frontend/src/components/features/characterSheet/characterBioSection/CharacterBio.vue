<template>
    <div class="character-bio-section">

        <!-- In-Sheet Bio Display -->
        <div class="bio-content edit-hover-area" @click="openViewModal">
            <EditButton size="small" visibility="on-hover" class="edit-button-overlay-small"
                @click.stop="openEditModal" />
            <template v-if="character.personalityAndBackground">
                <div v-html="safeFormattedBio" class="bio-text"></div>
            </template>
            <span v-else class="empty-bio">What's your vibe? What's your story? Where are you going?</span>
        </div>

        <!-- Full-Size View Modal -->
        <div v-if="isViewModalOpen && !isEditModalOpen" class="modal-overlay" @click="closeViewModal">
            <div class="modal-content view-modal edit-hover-area" @click.stop>
                <EditButton size="small" visibility="on-hover" class="edit-button-overlay"
                    @click.stop="openEditModal" />
                <div class="full-text-content">
                    <div v-if="character.personalityAndBackground" v-html="safeFormattedBio" class="full-text">
                    </div>
                    <p v-else class="empty-text">What's your vibe? What's your story? Where are you going?</p>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <div v-if="isEditModalOpen" class="modal-overlay edit-modal-overlay" @click="handleEditOverlayClick">
            <div class="modal-content" @click.stop>
                <div class="modal-body">
                    <TextEditor v-model="editedContent"
                        placeholder="Describe your character's personality, history, and notable bio..."
                        height="300px" />
                </div>

                <div class="modal-footer">
                    <div class="form-buttons">
                        <ActionButton variant="success" size="small" text="Save" @click="saveChanges" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatText } from '@shared/utils/stringUtils'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import EditButton from '@/components/ui/buttons/EditButton.vue'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['update-character'])

const isViewModalOpen = ref(false)
const isEditModalOpen = ref(false)
const shouldReturnToView = ref(false)
const editedContent = ref('')

const safeFormattedBio = computed(() => {
    if (!props.character.personalityAndBackground) return ''
    return sanitizeHtml(formatText(props.character.personalityAndBackground))
})

const openViewModal = () => {
    isViewModalOpen.value = true
}

const closeViewModal = () => {
    isViewModalOpen.value = false
}

const openEditModal = () => {
    editedContent.value = props.character.personalityAndBackground || ''
    shouldReturnToView.value = isViewModalOpen.value
    isEditModalOpen.value = true
}

const closeEditModal = () => {
    isEditModalOpen.value = false
    if (shouldReturnToView.value) {
        isViewModalOpen.value = true
        shouldReturnToView.value = false
    }
}

const handleEditOverlayClick = () => {
    const hasChanges = editedContent.value !== (props.character.personalityAndBackground || '')

    if (hasChanges) {
        const shouldDiscard = confirm('Discard unsaved changes?')
        if (shouldDiscard) {
            closeEditModal()
        }
    } else {
        closeEditModal()
    }
}

const saveChanges = () => {
    const updatedCharacter = {
        ...props.character,
        personalityAndBackground: editedContent.value,
    }
    emit('update-character', updatedCharacter)
    closeEditModal()
}
</script>
<style scoped>
.character-bio-section {
    display: flex;
    flex-direction: column;
    flex: 3;
    position: relative;
    height: 180px;
}

.section-label {
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
    margin-bottom: 5px;
}

.bio-content {
    position: relative;
    padding: var(--space-md);
    background-color: var(--color-dark-gray);
    border-radius: var(--radius-5);
    height: 100%;
    font-size: var(--font-size-12);
    cursor: pointer;
    transition: var(--transition-background);
    overflow-y: auto;
}

.bio-content:hover {
    background-color: var(--overlay-white-medium);
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

.bio-text :deep(p) {
    margin: 0;
    margin-bottom: 0.5em;
}

.bio-text :deep(p:last-child) {
    margin-bottom: 0;
}

.empty-bio {
    color: var(--color-gray-light);
    font-style: italic;
}

.edit-button-overlay-small {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    z-index: var(--z-raised);
}

/* Full-size view modal styles */
.view-modal {
    max-width: var(--width-modal);
    max-height: 90%;
    padding: var(--space-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    position: relative;
}

.edit-button-overlay {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    z-index: var(--z-raised);
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

.full-text :deep(p) {
    margin-bottom: var(--space-md);
}

.full-text :deep(p:last-child) {
    margin-bottom: 0;
}

.empty-text {
    color: var(--color-gray-light);
    font-style: italic;
    font-size: var(--font-size-16);
}

.modal-content {
    max-width: var(--width-modal);
}

/* Edit modal should be on top of view modal */
.edit-modal-overlay {
    z-index: calc(var(--z-modal) + 1);
}
</style>
