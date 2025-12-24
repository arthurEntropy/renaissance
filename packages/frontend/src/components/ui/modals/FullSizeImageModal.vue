<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content image-container edit-hover-area" @click.stop>
            <img :src="optimizedImageUrl" class="modal-image" :alt="altText" />
            <FloatingActionButton v-if="showEditButton" type="edit" size="small" visibility="on-hover"
                class="edit-button-overlay" @click.stop="$emit('edit')" />
        </div>
    </div>
</template>

<script setup>
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'

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
    }
})

defineEmits(['close', 'edit'])

const optimizedImageUrl = useOptimizedImage(() => props.imageUrl, 'xlarge')
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--overlay-black-heavy);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    backdrop-filter: blur(4px);
}

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
}

.edit-button-overlay {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    z-index: var(--z-raised);
}
</style>
