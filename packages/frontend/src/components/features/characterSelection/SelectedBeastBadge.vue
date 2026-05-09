<template>
    <div v-if="resolvedBeast" class="selected-beast-badge" :class="{
        'name-always-visible': props.alwaysShowName,
        'selected-beast-badge--inactive': props.isInactive,
    }" @click="handleClick">
        <div class="beast-portrait">
            <img :src="optimizedBeastArt" :alt="resolvedBeast.name" />
        </div>
        <FloatingActionButton v-if="props.showRemoveFab" class="close-fab" :variant="FAB_TYPES.DELETE"
            :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS" @click.stop="handleRemove" />
        <div class="beast-name-tooltip">{{ resolvedBeast.name }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    beast: { type: Object, default: null },
    alwaysShowName: { type: Boolean, default: false },
    showRemoveFab: { type: Boolean, default: false },
    disableDefaultClick: { type: Boolean, default: false },
    isInactive: { type: Boolean, default: false },
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

const handleClick = () => {
    emit('click', resolvedBeast.value)
    if (props.disableDefaultClick) return
    if (resolvedBeast.value) {
        router.push('/bestiary/' + createSlug(resolvedBeast.value.name))
    }
}

const handleRemove = () => {
    emit('remove', resolvedBeast.value)
}
</script>

<style scoped>
.selected-beast-badge {
    cursor: pointer;
    transition: transform var(--transition-normal);
}

.selected-beast-badge:hover {
    transform: scale(1.05);
}

.selected-beast-badge:hover .beast-name-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.beast-portrait {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--color-accent-cyan);
    box-shadow: var(--shadow-elevation-md);
}

.selected-beast-badge--inactive .beast-portrait {
    border-color: var(--color-gray-medium);
}

.beast-portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.beast-name-tooltip {
    position: absolute;
    bottom: -10px;
    left: 0;
    transform: translateY(10px);
    background-color: var(--overlay-black-heavy);
    color: var(--color-text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-3);
    font-size: var(--font-size-14);
    white-space: nowrap;
    opacity: 0;
    transition: opacity var(--transition-normal), transform var(--transition-normal);
    pointer-events: none;
}

.name-always-visible .beast-name-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.close-fab {
    position: absolute;
    top: -8px;
    right: -8px;
    opacity: 0 !important;
    pointer-events: none;
    transition: opacity var(--transition-normal);
}

.selected-beast-badge:hover .close-fab {
    opacity: 1 !important;
    pointer-events: auto;
}

@media (max-width: 768px) {
    .selected-beast-badge {
        top: auto;
        bottom: calc(var(--space-lg) + 50px + 80px);
        left: var(--space-lg);
    }

    .beast-name-tooltip {
        bottom: auto;
        top: -30px;
    }

    .close-fab {
        opacity: 1 !important;
        pointer-events: auto;
    }
}
</style>
