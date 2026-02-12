<template>
    <div class="selected-character-badge" :class="{ 'badge-pulse': shouldAnimate }" v-if="character && !shouldHideBadge"
        @click="navigateToCharacter">
        <div class="character-portrait">
            <img :src="optimizedCharacterArt" :alt="character.name" />
        </div>
        <div class="close-button" @click.stop="deselectCharacter">
            <XMarkIcon class="close-icon" />
        </div>
        <div class="character-name-tooltip">{{ character.name }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useOptimizedImage } from '@/composables/useOptimizedImage'

const router = useRouter()
const route = useRoute()
const charactersStore = useCharactersStore()

const character = computed(() => charactersStore.selectedCharacter)
const shouldAnimate = computed(() => charactersStore.isAddToCharacterHovering)
const optimizedCharacterArt = useOptimizedImage(() => character.value?.artUrls?.[0], 'thumbnail')

const shouldHideBadge = computed(() => {
    // Hide badge when on characters page with a character sheet open (route has :id param)
    return route.path.startsWith('/characters') && route.params.id
})

const navigateToCharacter = () => {
    router.push('/characters')
}

const deselectCharacter = () => {
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

.selected-character-badge.badge-pulse {
    transform: scale(1.25);
}

.selected-character-badge:hover {
    transform: scale(1.05);
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
    bottom: -30px;
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
