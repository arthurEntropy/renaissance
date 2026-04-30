<template>
    <div v-if="resolvedBeast" class="selected-beast-badge"
        :class="{
            'name-always-visible': props.alwaysShowName,
            'selected-beast-badge--inactive': props.isInactive,
        }"
        @click="handleClick">
        <div class="beast-portrait">
            <img :src="optimizedBeastArt" :alt="resolvedBeast.name" />
        </div>
        <div v-if="props.onRemove" class="close-button" @click.stop="handleRemove">
            <XMarkIcon class="close-icon" />
        </div>
        <div class="beast-name-tooltip">{{ resolvedBeast.name }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    beast: { type: Object, default: null },
    alwaysShowName: { type: Boolean, default: false },
    onRemove: { type: Function, default: null },
    onClick: { type: Function, default: null },
    isInactive: { type: Boolean, default: false },
})

const emit = defineEmits(['remove', 'click'])

const router = useRouter()
const charactersStore = useCharactersStore()

const resolvedBeast = computed(() => props.beast ?? charactersStore.summonedBeast)

const optimizedBeastArt = useOptimizedImage(
    () => resolvedBeast.value?.artUrls?.[0],
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const handleClick = () => {
    if (props.onClick) {
        props.onClick(resolvedBeast.value)
        return
    }

    emit('click', resolvedBeast.value)
    if (resolvedBeast.value) {
        router.push('/bestiary/' + createSlug(resolvedBeast.value.name))
    }
}

const handleRemove = () => {
    if (props.onRemove) {
        props.onRemove(resolvedBeast.value)
        return
    }

    emit('remove', resolvedBeast.value)
}
</script>

<style scoped>
.selected-beast-badge {
    position: fixed;
    /* Positioned below the character badge (50px portrait + --space-xl gap) */
    top: calc(var(--space-lg) + 3rem + 50px + var(--space-xl));
    left: var(--space-lg);
    z-index: var(--z-badge);
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
    left: 50%;
    transform: translateX(-50%) translateY(10px);
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
    transform: translateX(-50%) translateY(0);
}

.close-button {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: var(--color-black);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity var(--transition-normal);
    cursor: pointer;
}

.selected-beast-badge:hover .close-button {
    opacity: 1;
}

.close-icon {
    width: 16px;
    height: 16px;
    color: var(--color-text-primary);
}

.close-button:hover .close-icon {
    color: var(--color-danger);
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

    .close-button {
        opacity: 1;
    }
}
</style>
