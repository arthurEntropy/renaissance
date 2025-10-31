<template>
    <div class="navigation-controls">
        <button class="navigate-button prev" @click="$emit('navigate', -1)" :disabled="!hasPrevious"
            :title="hasPrevious ? 'Previous (← Left Arrow)' : 'No previous item'">
            <ChevronLeftIcon class="nav-icon" />
        </button>

        <slot />

        <button class="navigate-button next" @click="$emit('navigate', 1)" :disabled="!hasNext"
            :title="hasNext ? 'Next (→ Right Arrow)' : 'No next item'">
            <ChevronRightIcon class="nav-icon" />
        </button>
    </div>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
defineProps({
    hasPrevious: {
        type: Boolean,
        default: false,
    },
    hasNext: {
        type: Boolean,
        default: false,
    },
})

defineEmits(['navigate'])
</script>

<style scoped>
.navigation-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    z-index: var(--z-modal);
}

.navigate-button {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: var(--overlay-black-medium);
    color: var(--color-white);
    border: none;
    border-radius: var(--radius-full);
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: var(--z-tooltip);
    transition: var(--transition-all);
}

.nav-icon {
    width: 28px;
    height: 28px;
}

.navigate-button:hover:not(:disabled) {
    background: var(--overlay-white-medium);
}

.navigate-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.navigate-button.prev {
    left: 30px;
}

.navigate-button.next {
    right: 30px;
}

@media (max-width: var(--breakpoint-md)) {
    .navigate-button {
        width: 40px;
        height: 40px;
    }

    .nav-icon {
        width: 20px;
        height: 20px;
    }

    .navigate-button.prev {
        left: 5px;
    }

    .navigate-button.next {
        right: 5px;
    }
}
</style>
