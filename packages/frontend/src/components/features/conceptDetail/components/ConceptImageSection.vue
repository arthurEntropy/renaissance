<template>
    <ConceptSection :title="showTitle ? title : ''" :has-content="hasImages" :is-edit-mode="isEditMode"
        :empty-message="`No ${title.toLowerCase()} added yet.`">
        <ImageGallery :images="computedImages" :editable="isEditMode" :grid-columns="gridColumns" :mode="mode"
            :auto-source-type="autoSourceType" :auto-source-id="computedAutoSourceId"
            :exclude-urls="computedExcludeUrls" @update:images="handleImagesUpdate" />
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import ImageGallery from './ImageGallery.vue'
import { useArtStore } from '@/stores/artStore'
import { useConceptsStore } from '@/stores/conceptsStore'

const artStore = useArtStore()
const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedItem)

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    showTitle: {
        type: Boolean,
        default: true
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
    }
})

defineEmits(['update:images'])

// Computed properties for images handling
const computedImages = computed(() => {
    if (props.mode === 'manual') {
        return concept.value?.artUrls || []
    }
    return []
})

const computedAutoSourceId = computed(() => {
    return concept.value?.id || null
})

const computedExcludeUrls = computed(() => {
    return concept.value?.artUrls || []
})

const handleImagesUpdate = (newImages) => {
    if (concept.value && props.mode === 'manual') {
        concept.value.artUrls = [...newImages]
    }
}

const hasImages = computed(() => {
    // In auto mode, check art store; in manual mode, check props
    if (props.mode === 'auto' && computedAutoSourceId.value) {
        // Get images from art store and filter out excluded URLs
        const autoImages = artStore.getByTypeAndSource(props.autoSourceType, computedAutoSourceId.value)
        const imageUrls = autoImages.map(item => item.url)
        const filteredImages = imageUrls.filter(url => !computedExcludeUrls.value.includes(url))
        return filteredImages.length > 0
    }
    return computedImages.value && computedImages.value.length > 0
})
</script>

<style scoped></style>
