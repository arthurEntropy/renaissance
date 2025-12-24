<template>
    <div>
        <div class="character-art-container edit-hover-area">
            <img :src="optimizedCharacterImageUrl" class="character-art-image" @click="openFullSizeArtModal" />
            <FloatingActionButton v-if="canEdit" type="edit" size="small" visibility="on-hover"
                class="edit-button-overlay-small" @click.stop="openEditModal" />
        </div>

        <!-- Full Size Art Modal -->
        <FullSizeImageModal :is-open="fullSizeArtModal.isOpen.value" :image-url="characterImageUrl"
            :show-edit-button="canEdit" @close="fullSizeArtModal.closeModal" @edit="openEditModal" />

        <!-- Edit Modal -->
        <div v-if="editModal.isOpen.value" class="modal-overlay edit-modal-overlay"
            @click="handleEditModalOverlayClick">
            <div class="modal-content edit-modal-content" @click.stop>
                <h3>Change Character Art</h3>
                <input type="text" v-model="tempArtUrl" class="modal-input" placeholder="Enter image URL" />
                <div class="modal-actions">
                    <ActionButton variant="success" size="small" text="Save" @click="saveArtUrl"
                        :disabled="!isValidImageUrl(tempArtUrl)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useModal } from '@/composables/useModal'
import { useCharactersStore } from '@/stores/charactersStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FullSizeImageModal from '@/components/ui/modals/FullSizeImageModal.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'

const charactersStore = useCharactersStore()

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const fullSizeArtModal = useModal()
const editModal = useModal()

const tempArtUrl = ref('')

const characterImageUrl = computed(() => {
    return character.value?.artUrls?.[0] ?? ''
})

// Optimized image URL for display
const optimizedCharacterImageUrl = useOptimizedImage(characterImageUrl, 'medium')

const isValidImageUrl = (url) => {
    if (!url) return false
    const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i
    return urlPattern.test(url)
}

const openFullSizeArtModal = () => {
    fullSizeArtModal.openModal()
}

const openEditModal = () => {
    tempArtUrl.value = character.value?.artUrls?.[0] || ''
    editModal.openModal()
}

const saveArtUrl = () => {
    if (!character.value.artUrls) {
        character.value.artUrls = []
    }
    character.value.artUrls[0] = tempArtUrl.value
    editModal.closeModal()
}

const handleEditModalOverlayClick = () => {
    const originalUrl = character.value?.artUrls?.[0] || ''
    const hasChanges = tempArtUrl.value !== originalUrl

    if (hasChanges) {
        const shouldDiscard = confirm('Discard unsaved changes?')
        if (shouldDiscard) {
            editModal.closeModal()
        }
    } else {
        editModal.closeModal()
    }
}
</script>

<style scoped>
div {
    flex: 0 0 auto;
    text-align: center;
}

.character-art-container {
    position: relative;
    display: inline-block;
}

.character-art-image {
    width: 170px;
    height: 170px;
    object-fit: cover;
    border-radius: var(--radius-5);
    box-shadow: var(--shadow-elevation-sm);
    cursor: zoom-in;
}

.edit-button-overlay-small {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    z-index: var(--z-raised);
}

.edit-modal-overlay {
    z-index: calc(var(--z-modal) + 1);
}

.edit-modal-content {
    width: auto;
    min-width: 400px;
    padding: var(--space-lg);
    background: var(--color-bg-primary);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
    margin-top: var(--space-md);
}
</style>
