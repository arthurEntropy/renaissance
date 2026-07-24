<template>
    <BaseToken v-if="resolvedBeast" :entity="resolvedBeast" :imageSrc="optimizedBeastArt" :variant="variant"
        :alwaysShowName="alwaysShowName" :showRemoveFab="showRemoveFab" :isInactive="isInactive" @click="handleClick"
        @remove="handleRemove" />
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import BaseToken from './BaseToken.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    beast: { type: Object, default: null },
    alwaysShowName: { type: Boolean, default: false },
    showRemoveFab: { type: Boolean, default: false },
    disableDefaultClick: { type: Boolean, default: false },
    isInactive: { type: Boolean, default: false },
    variant: { type: String, default: 'beast' },
})

const emit = defineEmits(['remove', 'click'])

const router = useRouter()
const charactersStore = useCharactersStore()

// Use explicit beast prop; fall back to store summonedBeast only when no prop is provided at all
const resolvedBeast = computed(() => props.beast !== undefined ? props.beast : charactersStore.summonedBeast)

const optimizedBeastArt = useOptimizedImage(
    () => resolvedBeast.value?.featuredArtUrls?.[0],
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const handleClick = (beast) => {
    emit('click', beast)
    if (props.disableDefaultClick) return
    if (beast) {
        router.push('/bestiary/' + createSlug(beast.name))
    }
}

const handleRemove = (beast) => {
    emit('remove', beast)
}
</script>
