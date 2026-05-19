<template>
    <section class="character-column-base" :class="columnClasses" :style="columnBgStyle">
        <div class="column-bg-overlay" aria-hidden="true"></div>

        <!-- Character info header -->
        <div v-if="character" class="character-header">
            <header class="character-info">
                <h3>{{ character.name }}</h3>
                <slot name="additional-character-info" :character="character"></slot>
            </header>
        </div>

        <!-- Main content area -->
        <div v-if="character" class="column-content">
            <slot name="content"></slot>
        </div>

        <!-- Waiting for opponent placeholder -->
        <div v-else class="waiting-for-opponent">
            <div class="placeholder-message">
                <LoadingSpinner size="medium" />
                <p>Waiting for an opponent to join...</p>
            </div>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    character: {
        type: Object,
        default: null
    },
    isOpponent: {
        type: Boolean,
        default: false
    },
    showResults: {
        type: Boolean,
        default: false
    },
    // Parent components compute winner/loser using their own logic
    // (engagement comparisons, skill check totals, etc.) and pass down for styling
    isWinner: {
        type: Boolean,
        default: false
    },
    isLoser: {
        type: Boolean,
        default: false
    }
})

const characterArtUrl = computed(() => {
    if (!props.character) return null
    return props.character.featuredArtUrls?.[0] || null
})

const optimizedCharacterArt = useOptimizedImage(characterArtUrl, MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM)

const columnBgStyle = computed(() => {
    if (!characterArtUrl.value) return {}
    return { backgroundImage: `url('${optimizedCharacterArt.value}')` }
})

const columnClasses = computed(() => {
    const classes = []

    // Side styling
    if (props.isOpponent) {
        classes.push('opponent-column')
    } else {
        classes.push('user-column')
    }

    // Result styling
    if (props.showResults) {
        if (props.isWinner) {
            classes.push('winner-column')
        } else if (props.isLoser) {
            classes.push('loser-column')
        }
    }

    return classes
})
</script>

<style scoped>
.character-column-base {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-10);
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
}

.column-bg-overlay {
    position: absolute;
    inset: 0;
    background: var(--overlay-black-heavy);
}

.character-header,
.column-content,
.waiting-for-opponent {
    position: relative;
    z-index: 1;
}

.character-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: var(--space-lg);
    margin-bottom: var(--space-md);
    flex-shrink: 0;
}

.character-info h3 {
    font-size: var(--font-size-24);
}

.column-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.waiting-for-opponent {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.placeholder-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    text-align: center;
}
</style>
