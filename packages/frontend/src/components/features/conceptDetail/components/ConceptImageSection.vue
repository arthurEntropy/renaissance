<template>
    <ConceptSection :title="showTitle ? title : ''" :has-content="hasImages" :is-edit-mode="isEditMode"
        :empty-message="`No ${title.toLowerCase()} added yet.`">
        <ImageGallery :images="images" :editable="isEditMode" :grid-columns="gridColumns"
            @update:images="$emit('update:images', $event)" />
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import ImageGallery from './ImageGallery.vue'

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    showTitle: {
        type: Boolean,
        default: true
    },
    images: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    gridColumns: {
        type: Number,
        default: 5
    }
})

defineEmits(['update:images'])

const hasImages = computed(() => {
    return props.images && props.images.length > 0
})
</script>

<style scoped></style>
