<template>
    <div class="selected-character-badge" :class="{
        'name-always-visible': alwaysShowName,
        'selected-character-badge--inactive': isInactive,
    }" v-if="resolvedCharacter && !shouldHideBadge" @click="handleClick">
        <div class="character-portrait">
            <img :src="optimizedCharacterArt" :alt="resolvedCharacter.name" />
        </div>
        <div class="close-button" @click.stop="handleRemove">
            <XMarkIcon class="close-icon" />
        </div>
        <div class="character-name-tooltip">{{ resolvedCharacter.name }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    /** Override the character shown (instead of the store's activePlayerCharacter) */
    character: { type: Object, default: null },
    /** Always show the name tooltip without hover */
    alwaysShowName: { type: Boolean, default: false },
    /** Custom remove handler — if provided, replaces the default deselectCharacter */
    onRemove: { type: Function, default: null },
    /** Custom click handler — if provided, replaces the default navigation */
    onClick: { type: Function, default: null },
    /** Render with inactive status ring styling */
    isInactive: { type: Boolean, default: false },
})

const emit = defineEmits(['remove', 'click'])

const router = useRouter()
const route = useRoute()
const charactersStore = useCharactersStore()

const resolvedCharacter = computed(() => props.character ?? charactersStore.activePlayerCharacter)

const optimizedCharacterArt = useOptimizedImage(
    () => resolvedCharacter.value?.artUrls?.[0],
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const shouldHideBadge = computed(() => {
    // Only apply default hide logic when using the store character
    if (props.character) return false
    return route.path.startsWith('/characters') && route.params.id
})

const handleClick = () => {
    if (props.onClick) {
        props.onClick(resolvedCharacter.value)
        return
    }
    emit('click', resolvedCharacter.value)
    if (resolvedCharacter.value) {
        router.push('/characters/' + createSlug(resolvedCharacter.value.name))
    } else {
        router.push('/characters')
    }
}

const handleRemove = () => {
    if (props.onRemove) {
        props.onRemove(resolvedCharacter.value)
        return
    }
    emit('remove', resolvedCharacter.value)
    charactersStore.deselectCharacter()
}
</script>

<style scoped>
.selected-character-badge {
    position: fixed;
    top: calc(var(--space-lg) + 3rem);
    left: var(--space-lg);
    z-index: var(--z-badge);
    cursor: pointer;
    transition: transform var(--transition-normal);
}

.selected-character-badge:hover {
    transform: scale(1.05);
    z-index: calc(var(--z-badge) + 1);
}

.selected-character-badge:hover .character-name-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.character-portrait {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--color-primary);
    box-shadow: var(--shadow-elevation-md);
    transition: box-shadow var(--transition-normal);
}

.badge-pulse .character-portrait {
    box-shadow: var(--shadow-elevation-md);
}

.selected-character-badge--inactive .character-portrait {
    border-color: var(--color-gray-medium);
}

.character-portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

.selected-character-badge:hover .close-button {
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

.character-name-tooltip {
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

/* Always-visible name variant */
.name-always-visible .character-name-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

@media (max-width: 768px) {
    .selected-character-badge {
        top: auto;
        bottom: var(--space-lg);
        left: var(--space-lg);
    }

    .close-button {
        opacity: 1;
    }

    .character-name-tooltip {
        bottom: auto;
        top: -30px;
    }
}
</style>
