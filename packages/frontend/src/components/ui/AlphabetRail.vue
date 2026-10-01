<template>
    <aside ref="rail" class="alphabet-rail" :class="{ 'alphabet-rail--visible': isVisible }"
        aria-label="Jump to item by first letter" @pointerdown.prevent="startTracking"
        @pointermove.prevent="moveTracking" @pointerup="stopTracking" @pointercancel="stopTracking"
        @lostpointercapture="stopTracking">
        <button v-for="letter in letters" :key="letter" type="button" :data-letter="letter"
            :aria-label="`Jump to ${letter}`" :aria-disabled="!availableLetters.has(letter)"
            :class="{ active: activeLetter === letter, unavailable: !availableLetters.has(letter) }"
            @click="selectLetter(letter)">
            {{ letter }}
        </button>
    </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getAlphabetLetter } from '@/utils/getAlphabetLetter'
import { useScrollActivity } from '@/composables/useScrollActivity'

const props = defineProps({
    items: { type: Array, default: () => [] },
})

const emit = defineEmits(['select'])
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const rail = ref(null)
const activeLetter = ref('')
const isTracking = ref(false)

const { isScrolling } = useScrollActivity(500)
const isVisible = computed(() => isScrolling.value || isTracking.value)

const availableLetters = computed(() => new Set(
    props.items
        .map((item) => getAlphabetLetter(item?.name))
        .filter(Boolean),
))

const selectLetter = (letter) => {
    if (!availableLetters.value.has(letter)) return
    activeLetter.value = letter
    emit('select', letter)
}

const selectAtPosition = (clientY) => {
    const bounds = rail.value?.getBoundingClientRect()
    if (!bounds || bounds.height <= 0) return
    const position = Math.min(Math.max((clientY - bounds.top) / bounds.height, 0), 0.9999)
    selectLetter(letters[Math.floor(position * letters.length)])
}

const startTracking = (event) => {
    isTracking.value = true
    rail.value?.setPointerCapture(event.pointerId)
    selectAtPosition(event.clientY)
}

const moveTracking = (event) => {
    if (isTracking.value) selectAtPosition(event.clientY)
}

const stopTracking = () => {
    isTracking.value = false
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.alphabet-rail {
    display: none;
}

@media (max-width: 767px) {
    .alphabet-rail {
        position: fixed;
        z-index: var(--z-tooltip);
        top: calc(var(--nav-height) + var(--space-md));
        right: 0;
        bottom: var(--space-md);
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 26px;
        padding: var(--space-xs) 0;
        touch-action: none;
        user-select: none;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-in;
    }

    .alphabet-rail--visible {
        opacity: 1;
        pointer-events: auto;
    }

    .alphabet-rail button {
        flex: 1 1 0;
        min-height: 0;
        padding: 0;
        color: var(--color-text-primary);
        background: transparent;
        border: 0;
        font: inherit;
        font-size: 10px;
        line-height: 1;
        text-align: center;
        text-shadow: 0 1px 3px var(--color-black);
    }

    .alphabet-rail button.unavailable {
        opacity: 0.35;
    }

    .alphabet-rail button.active {
        color: var(--color-accent-cyan);
        font-weight: var(--font-weight-bold);
    }
}
</style>