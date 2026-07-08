<template>
    <BaseModal :open="isOpen" hide-header width="auto" :box-style="imageBoxStyle" :overlay-style="imageOverlayStyle"
        @close="$emit('close')">
        <div class="image-container edit-hover-area" @click.stop>
            <img :src="modalImageSrc" class="modal-image"
                :class="{ 'modal-image--loading': isProgressive && !isFullQualityLoaded }" :alt="altText" />
            <FloatingActionButton v-if="showEditButton" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" class="edit-button-overlay" @click.stop="$emit('edit')" />
        </div>
        <!-- Navigation controls (shown only when there are multiple images) -->
        <NavigationControls v-if="hasPrevious || hasNext" :has-previous="hasPrevious" :has-next="hasNext"
            @navigate="$emit('navigate', $event)" />
    </BaseModal>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import NavigationControls from '@/components/ui/NavigationControls.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useProgressiveOptimizedImage } from '@/composables/useOptimizedImage'
import { PROGRESSIVE_IMAGE_CONTEXTS } from '@/constants/imageOptimization'

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    altText: {
        type: String,
        default: 'Full size image'
    },
    showEditButton: {
        type: Boolean,
        default: false
    },
    hasPrevious: {
        type: Boolean,
        default: false
    },
    hasNext: {
        type: Boolean,
        default: false
    },
})

const _emit = defineEmits(['close', 'edit', 'navigate'])

const imageBoxStyle = {
    background: 'transparent',
    border: 'none',
    padding: '0',
    boxShadow: 'none',
    minWidth: '0',
    overflow: 'visible',
    maxHeight: 'none',
}

const imageOverlayStyle = { backdropFilter: 'blur(4px)' }

const {
    activeUrl: modalImageSrc,
    isProgressive,
    isFinalLoaded: isFullQualityLoaded
} = useProgressiveOptimizedImage(() => props.imageUrl, {
    previewContext: PROGRESSIVE_IMAGE_CONTEXTS.FULL_SIZE_MODAL.preview,
    finalContext: PROGRESSIVE_IMAGE_CONTEXTS.FULL_SIZE_MODAL.final
})

// Keyboard navigation: intercept arrow keys when modal is open so they
// navigate within the gallery rather than triggering ConceptsLayout navigation.
const handleKeydown = (e) => {
    if (!props.isOpen) return
    if (e.key === 'ArrowLeft') {
        e.stopImmediatePropagation()
        if (props.hasPrevious) _emit('navigate', -1)
    } else if (e.key === 'ArrowRight') {
        e.stopImmediatePropagation()
        if (props.hasNext) _emit('navigate', 1)
    }
}

onMounted(() => window.addEventListener('keydown', handleKeydown, { capture: true }))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown, { capture: true }))

</script>

<style scoped>
.image-container {
    position: relative;
    display: inline-block;
    padding: 0;
}

.modal-image {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    display: block;
    transition: filter 220ms ease;
}

.modal-image--loading {
    filter: blur(3px);
}

.edit-button-overlay {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    z-index: var(--z-raised);
}
</style>
