<template>
    <div>
        <div class="character-art-container edit-hover-area">
            <img :src="characterImageUrl" class="character-art-image" @click="openModal" />
            <EditButton size="small" visibility="on-hover" class="edit-button-overlay-small"
                @click.stop="openChangeArtModal" />
        </div>

        <!-- Full Size Art Modal -->
        <div v-if="fullSizeModal.isOpen.value" class="modal-overlay" @click="fullSizeModal.closeModal">
            <div class="modal-content image-container edit-hover-area" @click.stop>
                <img :src="characterImageUrl" class="modal-image" />
                <EditButton size="small" visibility="on-hover" class="edit-button-overlay"
                    @click.stop="openChangeArtModal" />
            </div>
        </div>

        <!-- Change Art Modal -->
        <div v-if="changeArtModal.isOpen.value" class="modal-overlay change-art-overlay"
            @click="handleChangeArtOverlayClick">
            <div class="modal-content change-art-modal" @click.stop>
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
import { isValidImageUrl } from '@shared/utils/stringUtils'
import CharacterService from '@/services/characterService'
import EditButton from '@/components/ui/buttons/EditButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

// Props
const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

// Emits
const emit = defineEmits(['update-character'])

// Modal management
const fullSizeModal = useModal()
const changeArtModal = useModal()

// State
const tempArtUrl = ref('')

// Computed properties
const characterImageUrl = computed(() => {
    return props.character.artUrls?.[0] ?? CharacterService.DEFAULT_ART_URL
})

// Methods
const openModal = () => {
    fullSizeModal.openModal()
}

const openChangeArtModal = () => {
    tempArtUrl.value = props.character.artUrls?.[0] || ''
    changeArtModal.openModal()
}

const saveArtUrl = () => {
    const updatedCharacter = { ...props.character }
    if (!updatedCharacter.artUrls) {
        updatedCharacter.artUrls = []
    }
    updatedCharacter.artUrls[0] = tempArtUrl.value
    emit('update-character', updatedCharacter)
    changeArtModal.closeModal()
}

const handleChangeArtOverlayClick = () => {
    const originalUrl = props.character.artUrls?.[0] || ''
    const hasChanges = tempArtUrl.value !== originalUrl

    if (hasChanges) {
        const shouldDiscard = confirm('Discard unsaved changes?')
        if (shouldDiscard) {
            changeArtModal.closeModal()
        }
    } else {
        changeArtModal.closeModal()
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
    cursor: pointer;
}

.edit-button-overlay-small {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    z-index: var(--z-raised);
}

/* Shared modal styles */
.modal-overlay {
    background-color: var(--overlay-black-heavy);
    z-index: var(--z-modal);
}

.change-art-overlay {
    z-index: calc(var(--z-modal) + 1);
}

.modal-content {
    max-width: 90%;
    max-height: 90%;
}

.change-art-modal {
    width: auto;
    max-width: 90%;
    min-width: 400px;
    padding: var(--space-lg);
    background: var(--color-bg-primary);
    border-radius: var(--border-radius-lg);
}

/* Full-size image modal specific */
.image-container {
    position: relative;
    display: inline-block;
    padding: 0;
    /* Override global modal padding for image container */
}

.modal-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    display: block;
}

.edit-button-overlay {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    z-index: var(--z-raised);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
    margin-top: var(--space-md);
}
</style>
