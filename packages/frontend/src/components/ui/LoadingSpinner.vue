<template>
    <div class="loading-spinner" :class="`loading-spinner--${size}`"></div>
</template>

<script setup>
defineProps({
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
})
</script>

<style scoped>
.loading-spinner {
    border-radius: 50%;
    border-style: solid;
    border-color: var(--color-gray-medium);
    border-top-color: var(--color-text-primary);
    animation: loading-spinner-spin 1s linear infinite;
}

.loading-spinner--small {
    width: 16px;
    height: 16px;
    border-width: 2px;
}

.loading-spinner--medium {
    width: 24px;
    height: 24px;
    border-width: 3px;
}

.loading-spinner--large {
    width: 32px;
    height: 32px;
    border-width: 4px;
}

@keyframes loading-spinner-spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    .loading-spinner {
        animation: none;
        /* Show a pulsing opacity instead of spinning */
        animation: loading-spinner-pulse 1.5s ease-in-out infinite;
    }

    @keyframes loading-spinner-pulse {

        0%,
        100% {
            opacity: 0.5;
        }

        50% {
            opacity: 1;
        }
    }
}
</style>
