<template>
    <div>
        <div class="character-art-container edit-hover-area">
            <img :src="optimizedCharacterImageUrl" class="character-art-image" @click="openFullSizeArtModal" />
            <FloatingActionButton v-if="canEdit" :type="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" class="edit-button-overlay-small" @click.stop="openEditModal" />
            <!-- Swagger overlay for Landsknecht -->
            <div v-if="isLandsknecht" class="swagger-overlay">
                <div v-if="hoveredPip !== null" class="swagger-label">Swagger: {{ swagger }}</div>
                <div class="swagger-pip-row">
                    <button v-for="i in SWAGGER_MAX" :key="i - 1" type="button" class="swagger-pip"
                        :class="getSwaggerPipClasses(i - 1)" @click.stop="handleSwaggerPipClick(i - 1)"
                        @mouseenter="hoveredPip = i - 1" @mouseleave="hoveredPip = null" :title="`Swagger ${i}`">
                        <span class="swagger-pip-icon" :style="swaggerPipStyle"></span>
                    </button>
                </div>
            </div>
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
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FullSizeImageModal from '@/components/ui/modals/FullSizeImageModal.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'
import { LANDSKNECHT_MESTIERE_ID, SWAGGER_MAX, SWAGGER_ICONS, shieldMaskStyle } from './swaggerConstants'

const charactersStore = useCharactersStore()

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

// Swagger (Landsknecht)
const hoveredPip = ref(null)

const isLandsknecht = computed(() => character.value?.mestiereId === LANDSKNECHT_MESTIERE_ID)

const swagger = computed({
    get: () => character.value?.swagger ?? 0,
    set: (value) => {
        if (character.value) character.value.swagger = value
    }
})

const swaggerIconIndex = computed(() => character.value?.swaggerIconIndex ?? 0)

const swaggerColor = computed(() => character.value?.swaggerColor ?? '#ffffff')

const swaggerPipStyle = computed(() =>
    shieldMaskStyle(SWAGGER_ICONS[swaggerIconIndex.value], swaggerColor.value)
)

function handleSwaggerPipClick(index) {
    const newValue = index + 1
    swagger.value = newValue === swagger.value ? swagger.value - 1 : newValue
}

function getSwaggerPipClasses(index) {
    const isActive = index < swagger.value
    const showHoverPreview = hoveredPip.value !== null && !isActive && index <= hoveredPip.value
    return {
        'pip-active': isActive,
        'pip-hover': showHoverPreview,
    }
}

const fullSizeArtModal = useModal()
const editModal = useModal()

const tempArtUrl = ref('')

const characterImageUrl = computed(() => {
    return character.value?.artUrls?.[0] ?? ''
})

// Optimized image URL for display
const optimizedCharacterImageUrl = useOptimizedImage(characterImageUrl, MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM)

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
    width: 185px;
    height: 185px;
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

/* Swagger pip overlay */
.swagger-overlay {
    position: absolute;
    bottom: 6px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    pointer-events: auto;
}

.swagger-label {
    font-size: var(--font-size-14);
    color: var(--color-white);
    white-space: nowrap;
    pointer-events: none;
}

.swagger-pip-row {
    display: flex;
    gap: 4px;
}

.swagger-pip {
    width: 26px;
    height: 26px;
    background: transparent;
    border: none;
    padding: 2px;
    cursor: pointer;
    opacity: 0.25;
    transition: opacity var(--transition-fast);
}

.swagger-pip.pip-active {
    opacity: 1;
}

.swagger-pip.pip-hover {
    opacity: 0.6;
}

.swagger-pip-icon {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
}
</style>
