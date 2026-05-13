<template>
    <BaseToken v-if="ability" :entity="ability" :imageSrc="abilityArt" variant="ability" :square="true"
        :alwaysShowName="false" :showRemoveFab="showRemoveFab" :removeFabVariant="FAB_TYPES.DEACTIVATE"
        :class="{ 'ability-token--active': isActive }" @click="$emit('click', ability)"
        @remove="$emit('remove', ability)" @mouseenter="onMouseEnter" @mouseleave="cardPreview.scheduleHide()" />
</template>

<script setup>
import BaseToken from './BaseToken.vue'
import { FAB_TYPES } from '@/constants/fab'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { useCardPreview } from '@/composables/useCardPreview'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    ability: { type: Object, required: true },
    showRemoveFab: { type: Boolean, default: true },
    isActive: { type: Boolean, default: false },
})

defineEmits(['click', 'remove'])

const cardPreview = useCardPreview()
const abilityArt = useOptimizedImage(() => props.ability?.artUrl, MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL)

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
