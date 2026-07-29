<template>
    <BaseToken v-if="ability" :entity="ability" :imageSrc="abilityArt" variant="ability" :square="true"
        :alwaysShowName="false" :showRemoveFab="showRemoveFab" :removeFabVariant="FAB_TYPES.DEACTIVATE"
        :class="{ 'ability-token--active': isActive }" @click="$emit('click', ability)"
        @remove="$emit('remove', ability)" @mouseenter="onMouseEnter" @mouseleave="cardPreview.scheduleHide()" />
</template>

<script setup>
import BaseToken from './BaseToken.vue'
import { computed } from 'vue'
import { FAB_TYPES } from '@/constants/fab'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { useCardPreview } from '@/composables/useCardPreview'
import { useSourcesStore } from '@/stores/sourcesStore'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    ability: { type: Object, required: true },
    showRemoveFab: { type: Boolean, default: true },
    isActive: { type: Boolean, default: false },
})

defineEmits(['click', 'remove'])

const cardPreview = useCardPreview()
const sourcesStore = useSourcesStore()

// Use ability art if available; fall back to the source's cardBackgroundImage.
const imageUrl = computed(() => {
    if (props.ability?.artUrl) return props.ability.artUrl
    return sourcesStore.getSourceById(props.ability?.source)?.cardBackgroundImage ?? null
})
const abilityArt = useOptimizedImage(() => imageUrl.value, MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL)

function onMouseEnter(event) {
    cardPreview.showAbilityPreview(props.ability, event.currentTarget, 1000)
}
</script>

<style scoped>
:deep(.token-portrait) {
    border: 0px;
}

/* Flame glow on the portrait when the ability is active */
.ability-token--active :deep(.token-portrait) {
    animation: flame-pulse 2.4s linear infinite;
    border: 1px solid rgba(255, 160, 0, 0.6) !important;
}
</style>
