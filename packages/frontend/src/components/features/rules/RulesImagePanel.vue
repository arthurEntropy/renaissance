<template>
    <div class="image-side">
        <div v-if="currentSection.imageUrl" class="side-image" :style="{
            backgroundImage: `url(${currentSection.imageUrl})`
        }">
        </div>
        <div v-else-if="isContentEditMode" class="add-image-placeholder">
            <span>Add Side Image</span>
        </div>
    </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRulesStore } from '@/stores/rulesStore'

const rulesStore = useRulesStore()
const isContentEditMode = inject('isContentEditMode', false)

const currentSection = computed(() => rulesStore.selectedSection || {})
</script>

<style scoped>
.image-side {
    width: 45%;
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    z-index: var(--z-overlay);
    pointer-events: none;
}

.side-image {
    position: fixed;
    top: var(--nav-height);
    right: calc((100vw - 80vw) / 2);
    width: calc(80vw * 0.45);
    height: calc(100vh - var(--nav-height));
    background-size: cover;
    background-position: right;
    mask-image: linear-gradient(to right, transparent 0%, black 300px);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 300px);
    pointer-events: auto;
}

.add-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--overlay-black-medium);
    color: var(--color-gray-light);
    font-style: italic;
    border: var(--border-width-2) dashed var(--color-gray-medium);
    border-radius: var(--radius-10);
}

@media (max-width: 767px) {
    .image-side {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
    }

    .side-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background-position: center;
        opacity: 0.2;
        mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 100%);
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 100%);
        pointer-events: none;
    }
}
</style>
