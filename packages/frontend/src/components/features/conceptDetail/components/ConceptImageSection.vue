<template>
    <ConceptSection :title="showTitle ? title : ''" :has-content="hasImages" :is-edit-mode="isEditMode"
        :empty-message="`No ${title.toLowerCase()} added yet.`">
        <ImageGallery :images="images" :editable="isEditMode" :grid-columns="gridColumns" :mode="mode"
            :auto-source-type="autoSourceType" :auto-source-id="autoSourceId" :exclude-urls="excludeUrls"
            @update:images="$emit('update:images', $event)" />
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import ImageGallery from './ImageGallery.vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()

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
    },
    mode: {
        type: String,
        default: 'manual',
        validator: (value) => ['manual', 'auto'].includes(value)
    },
    autoSourceType: {
        type: String,
        default: 'faces',
        validator: (value) => ['faces', 'places', 'maps'].includes(value)
    },
    autoSourceId: {
        type: String,
        default: null
    },
    excludeUrls: {
        type: Array,
        default: () => []
    }
})

defineEmits(['update:images'])

const hasImages = computed(() => {
    // In auto mode, check art store; in manual mode, check props
    if (props.mode === 'auto' && props.autoSourceId) {
        // Get images from art store and filter out excluded URLs
        const autoImages = artStore.getByTypeAndSource(props.autoSourceType, props.autoSourceId)
        const imageUrls = autoImages.map(item => item.url)
        const filteredImages = imageUrls.filter(url => !props.excludeUrls.includes(url))
        return filteredImages.length > 0
    }
    return props.images && props.images.length > 0
})
</script>

<style scoped></style>
