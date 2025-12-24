<template>
    <div v-if="isMultiEdit" class="multi-edit-notice">
        <h2>Edit Multiple Items</h2>
        <p>Multiple items selected</p>
    </div>
    <div v-else class="image-preview-section">
        <div v-if="url" class="image-preview">
            <img :src="url" alt="Art preview" />
        </div>
        <div v-else class="image-preview-placeholder" role="img" aria-label="No image preview available">
            <span>No image URL provided</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    url: {
        type: String,
        default: ''
    },
    isMultiEdit: {
        type: Boolean,
        default: false
    }
})
</script>

<style scoped>
.image-preview-section {
    margin-bottom: var(--space-lg);
}

@media (min-width: 1024px) {
    .image-preview-section {
        margin-bottom: 0;
        flex: 1;
        display: flex;
        align-items: stretch;
        justify-content: center;
        min-height: 0;
    }
}

.image-preview {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-10);
    overflow: hidden;
}

@media (min-width: 1024px) {
    .image-preview {
        aspect-ratio: 1/1;
        width: auto;
        height: 100%;
        max-width: 100%;
    }
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.image-preview-placeholder {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-10);
    background: var(--color-bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--color-border-secondary);
    color: var(--color-text-secondary);
}

@media (min-width: 1024px) {
    .image-preview-placeholder {
        aspect-ratio: 1/1;
        width: auto;
        height: 100%;
        max-width: 100%;
    }
}

.multi-edit-notice {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-10);
    background: var(--color-bg-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    border: 2px solid var(--color-primary);
    color: var(--color-text-primary);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
}

@media (min-width: 1024px) {
    .multi-edit-notice {
        aspect-ratio: 1/1;
        width: auto;
        height: 100%;
        max-width: 100%;
        margin-bottom: 0;
    }
}

.multi-edit-notice h2 {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-xs) 0;
}

.multi-edit-notice p {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    margin: 0;
}
</style>
