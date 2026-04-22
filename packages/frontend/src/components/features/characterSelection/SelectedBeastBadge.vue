<template>
    <div v-if="beast" class="selected-beast-badge" @click="navigateToBeast">
        <div class="beast-portrait">
            <img :src="optimizedBeastArt" :alt="beast.name" />
        </div>
        <div class="beast-name-tooltip">{{ beast.name }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'

const router = useRouter()
const charactersStore = useCharactersStore()

const beast = computed(() => charactersStore.summonedBeast)
const optimizedBeastArt = useOptimizedImage(() => beast.value?.artUrls?.[0], 'thumbnail')

const navigateToBeast = () => {
    router.push('/bestiary/' + createSlug(beast.value.name))
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
}
</style>
