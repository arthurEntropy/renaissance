<template>
    <section class="character-column-base" :class="columnClasses">

        <!-- Character info header -->
        <div v-if="character" class="character-header">
            <header class="character-info">
                <h3>{{ character.name }}</h3>
                <div class="character-art">
                    <img v-if="characterArtUrl" :src="optimizedCharacterArt" :alt="`${character.name} character art`"
                        class="character-art-thumbnail">
                    <div v-else class="character-art-placeholder" role="img" aria-label="No character art available">
                    </div>
                </div>
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
    return props.character.artUrls?.[0] || null
})

// Optimize character art thumbnail
const optimizedCharacterArt = useOptimizedImage(characterArtUrl, 'small')

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
.character-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: var(--space-md);
    height: 200px;
    justify-content: flex-start;
    flex-shrink: 0;
}

.character-art {
    display: flex;
    justify-content: center;
}

.character-art-thumbnail {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: var(--radius-full);
    margin: var(--space-md) 0;
    border: 2px solid var(--color-bg-secondary);
}

.character-art-placeholder {
    width: 100px;
    height: 100px;
    border-radius: var(--radius-full);
    margin: var(--space-md) 0;
    border: 2px solid var(--color-bg-secondary);
    background-color: var(--color-bg-secondary);
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
