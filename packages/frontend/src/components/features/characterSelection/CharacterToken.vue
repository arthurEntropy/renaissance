<template>
    <BaseToken v-if="resolvedCharacter && !shouldHideBadge" :entity="resolvedCharacter"
        :imageSrc="optimizedCharacterArt" variant="character" :alwaysShowName="alwaysShowName"
        :showRemoveFab="showRemoveFab" :isInactive="isInactive" @click="handleClick" @remove="handleRemove" />
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import BaseToken from './BaseToken.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    // Override the character shown instead of the store's selectedCharacter
    character: { type: Object, default: null },
    /** Always show the name tooltip without hover */
    alwaysShowName: { type: Boolean, default: false },
    /** Render with inactive status ring styling */
    isInactive: { type: Boolean, default: false },
    /** Show the delete FAB */
    showRemoveFab: { type: Boolean, default: true },
    /** Disable fallback navigation when the token is used in a container context */
    disableDefaultClick: { type: Boolean, default: false },
})

const emit = defineEmits(['remove', 'click'])

const router = useRouter()
const route = useRoute()
const charactersStore = useCharactersStore()

const resolvedCharacter = computed(() => props.character ?? charactersStore.selectedCharacter)

const optimizedCharacterArt = useOptimizedImage(
    () => resolvedCharacter.value?.featuredArtUrls?.[0],
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const shouldHideBadge = computed(() => {
    // Only apply default hide logic when using the store character
    if (props.character) return false
    return route.path.startsWith('/characters') && route.params.id
})

const handleClick = (character) => {
    emit('click', character)
    if (props.disableDefaultClick) return
    if (character) {
        router.push('/characters/' + createSlug(character.name))
    } else {
        router.push('/characters')
    }
}

const handleRemove = (character) => {
    if (!props.showRemoveFab) return
    emit('remove', character)
    if (!props.character) {
        charactersStore.deselectCharacter()
    }
}
</script>
