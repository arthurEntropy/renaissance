<template>
    <div class="image-side">
        <div class="side-image" :style="{
            backgroundImage: currentSection.imageUrl
                ? `url(${currentSection.imageUrl})`
                : 'url(/images/side-decoration.jpg)',
        }">
            <div v-if="isContentEditMode && !currentSection.imageUrl" class="add-image-placeholder">
                <span>Add Side Image</span>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    currentSection: {
        type: Object,
        required: true
    },
    isContentEditMode: {
        type: Boolean,
        required: true
    }
})
</script>

<style scoped>
.image-side {
    width: 45%;
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    z-index: var(--z-overlay);
}

/* Image styles */
.side-image {
    position: sticky;
    top: 0;
    height: 100%;
    background-size: cover;
    background-position: right;
    box-shadow: var(--shadow-inset-fade);
}

.side-image::before {
    display: none;
}

/* Placeholder for when no image is set */
.add-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--overlay-black-medium);
    color: var(--color-gray-light);
    font-style: italic;
    border: 2px dashed var(--color-gray-medium);
    border-radius: var(--radius-10);
}

/* Responsive adjustments */
@media (max-width: var(--breakpoint-md)) {
    .image-side {
        position: relative;
        width: 100%;
        height: 200px;
        margin-top: 20px;
    }

    .side-image {
        position: relative;
        height: 200px;
    }

    .side-image::before {
        width: 30%;
    }
}
</style>
