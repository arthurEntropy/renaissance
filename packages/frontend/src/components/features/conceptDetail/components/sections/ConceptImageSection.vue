<!--
  Displays images for a concept with two modes:
  
  - MANUAL mode: User-curated images (concept.artUrls) that can be edited/reordered
  - AUTO mode: Images from art library filtered by type (faces/places/maps) and concept ID
    Auto mode automatically excludes featured art to prevent duplicates
-->
<template>
    <ConceptSection :title="showTitle ? title : ''" :has-content="hasImages" :is-edit-mode="isEditMode"
        :empty-message="`No ${title.toLowerCase()} added yet.`">
        <ImageGallery :images="computedImages" :editable="isEditMode" :mode="mode" :auto-source-type="autoSourceType"
            :auto-source-id="computedAutoSourceId" :exclude-urls="computedExcludeUrls"
            @update:images="handleImagesUpdate" />
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import ImageGallery from '../shared/ImageGallery.vue'
import { useArtStore } from '@/stores/artStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { IMAGE_GALLERY_MODES, ART_TYPES } from '@shared/constants/artConstants.js'

const artStore = useArtStore()
const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

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
    mode: {
        type: String,
        default: IMAGE_GALLERY_MODES.MANUAL,
        validator: (value) => Object.values(IMAGE_GALLERY_MODES).includes(value)
    },
    autoSourceType: {
        type: String,
        default: ART_TYPES.FACES,
        validator: (value) => Object.values(ART_TYPES).includes(value)
    }
})

const computedImages = computed(() => {
    if (props.mode === IMAGE_GALLERY_MODES.MANUAL || props.mode === IMAGE_GALLERY_MODES.COMBINED) {
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

const handleImagesUpdate = async (newImages) => {
    if (concept.value && (props.mode === IMAGE_GALLERY_MODES.MANUAL || props.mode === IMAGE_GALLERY_MODES.COMBINED)) {
        concept.value.artUrls = [...newImages]
        await conceptsStore.update(concept.value)
    }
}

const hasImages = computed(() => {
    if (props.mode === IMAGE_GALLERY_MODES.AUTO && computedAutoSourceId.value) {
        const autoImages = artStore.getByTypeAndSource(props.autoSourceType, computedAutoSourceId.value)
        return autoImages.length > 0
    }
    if (props.mode === IMAGE_GALLERY_MODES.COMBINED && computedAutoSourceId.value) {
        const autoImages = artStore.getByTypeAndSource(props.autoSourceType, computedAutoSourceId.value)
        return computedImages.value.length > 0 || autoImages.length > 0
    }
    return computedImages.value.length > 0
})
</script>

<style scoped></style>
