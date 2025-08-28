<template>
    <div class="selected-character-badge" v-if="character && !isCharacterSheetOpen" @click="navigateToCharacter">
        <div class="character-portrait">
            <img :src="character.artUrls[0]" :alt="character.name" />
        </div>
        <div class="close-button" @click.stop="deselectCharacter">
            <XMarkIcon class="close-icon" />
        </div>
        <div class="character-name-tooltip">{{ character.name }}</div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const charactersStore = useCharactersStore()

// Computed property to get the selected character from the store
const character = computed(() => charactersStore.selectedCharacter)

// Check if character sheet is open
const isCharacterSheetOpen = ref(false)

// Function to check if the character sheet modal is open
const checkCharacterSheetOpen = () => {
    isCharacterSheetOpen.value = route.path === '/characters' &&
        document.querySelector('.modal-overlay') !== null
}

// Set up and clean up DOM observation for character sheet presence
onMounted(() => {
    // Initial check
    checkCharacterSheetOpen()

    // Set up mutation observer to detect modal opening/closing
    const targetNode = document.body
    const config = { childList: true, subtree: true }

    const observer = new MutationObserver(() => {
        checkCharacterSheetOpen()
    })

    observer.observe(targetNode, config)

    // Clean up observer on component unmount
    onUnmounted(() => {
        observer.disconnect()
    })
})

// Handler to navigate to the character sheet
const navigateToCharacter = () => {
    // Navigate to the characters page - the ConceptsLayout component will
    // automatically detect the selected character and open its sheet
    router.push('/characters')
}

// Handler to deselect the character
const deselectCharacter = () => {
    charactersStore.deselectCharacter()
}
</script>

<style scoped>
.selected-character-badge {
    position: fixed;
    top: calc(var(--space-lg) + 3rem);
    /* Position below the nav bar */
    left: var(--space-lg);
    z-index: var(--z-badge);
    cursor: pointer;
    transition: transform var(--transition-normal);
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

/* Media query for mobile devices */
@media (max-width: 768px) {
    .selected-character-badge {
        top: auto;
        bottom: var(--space-lg);
        left: var(--space-lg);
    }

    .close-button {
        opacity: 1;
        /* Always visible on mobile */
    }

    .character-name-tooltip {
        bottom: auto;
        top: -30px;
    }
}
</style>
