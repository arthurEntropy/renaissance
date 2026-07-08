<template>
    <section class="genetics-ancestry-column" :class="columnClasses" :style="columnBgStyle">
        <div class="column-bg-overlay" aria-hidden="true"></div>
        <div class="column-content">
            <header class="ancestry-header">
                <h3 class="ancestry-name">{{ ancestry.name }}</h3>
            </header>
            <div class="column-inner">
                <slot />
            </div>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    ancestry: {
        type: Object,
        required: true,
    },
    isSelected: {
        type: Boolean,
        default: false,
    },
    isAnimating: {
        type: Boolean,
        default: false,
    },
    isIdle: {
        type: Boolean,
        default: false,
    },
})

const artUrl = computed(() => props.ancestry.featuredArtUrls?.[0] || null)
const optimizedArt = useOptimizedImage(artUrl, MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM)

const columnBgStyle = computed(() => {
    if (!artUrl.value) return {}
    return { backgroundImage: `url('${optimizedArt.value}')` }
})

const columnClasses = computed(() => {
    const classes = []
    if (props.isSelected) classes.push('is-selected')
    if (props.isAnimating) classes.push('is-animating')
    if (props.isIdle) classes.push('is-idle')
    return classes
})
</script>

<style scoped>
.genetics-ancestry-column {
    margin: var(--space-md);
    position: relative;
    flex: 1;
    overflow: hidden;
    border-radius: var(--radius-10);
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    min-height: 380px;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.15s ease, outline 0.15s ease;
    outline: 2px solid transparent;
    outline-offset: 2px;
}

.genetics-ancestry-column.is-selected {
    outline-color: var(--color-accent-gold);
    box-shadow: var(--glow-gold-lg);
}

.genetics-ancestry-column.is-animating {
    outline-color: var(--color-primary);
    box-shadow: var(--glow-gold-sm);
}

.genetics-ancestry-column.is-idle {
    opacity: 0.55;
}

.column-bg-overlay {
    position: absolute;
    inset: 0;
    background: var(--overlay-black-heavy);
    transition: background 0.15s ease;
}

.genetics-ancestry-column.is-selected .column-bg-overlay {
    background: rgba(0, 0, 0, 0.55);
}

.column-content {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.ancestry-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-lg) var(--space-md) var(--space-md);
    flex-shrink: 0;
}

.ancestry-name {
    font-size: var(--font-size-20);
    margin: 0;
    text-align: center;
}

.column-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0 var(--space-md) var(--space-lg);
}
</style>
