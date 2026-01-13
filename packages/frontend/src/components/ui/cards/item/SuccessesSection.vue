<template>
    <div v-if="successes" class="successes-section">
        <!-- Divider with expand/collapse button -->
        <div v-if="successes" class="divider-container">
            <div class="divider-line"></div>
            <button @click.stop="toggleExpanded" class="emoji-toggle-button"
                :title="isExpanded ? 'Hide successes' : 'Show successes'">
                <span v-if="!isExpanded" class="emoji-preview">{{ uniqueEmojis }}</span>
                <span v-else class="collapse-icon">−</span>
            </button>
        </div>

        <!-- Expandable successes content -->
        <transition name="expand-successes">
            <div v-if="isExpanded" class="successes-content text-stroke" v-html="safeSuccesses"></div>
        </transition>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
    successes: {
        type: String,
        default: null
    },
    isExpanded: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:isExpanded'])

// Sanitize successes HTML content
const safeSuccesses = computed(() => sanitizeHtml(props.successes || ''))

// Extract unique emoji from successes content
const uniqueEmojis = computed(() => {
    if (!props.successes) return ''

    // Match emoji at the start of paragraphs (e.g., "✨:", "🌞:", "💀:")
    const emojiRegex = /<p>([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✨🌞💀])/gu
    const matches = [...props.successes.matchAll(emojiRegex)]

    // Get unique emoji
    const uniqueSet = new Set(matches.map(match => match[1]))
    return Array.from(uniqueSet).join('')
})

const toggleExpanded = () => {
    emit('update:isExpanded', !props.isExpanded)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.successes-section {
    /* No margin-top since we're inside CardDescription */
}

.divider-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 var(--space-xs) 0;
}

.divider-line {
    position: absolute;
    width: 100%;
    height: 1px;
    background: linear-gradient(to right,
            transparent,
            var(--color-border-primary) 20%,
            var(--color-border-primary) 80%,
            transparent);
    z-index: var(--z-base);
}

.emoji-toggle-button {
    position: relative;
    z-index: var(--z-interactive);
    background: var(--color-black);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-full);
    padding: var(--space-xs);
    cursor: pointer;
    font-size: var(--font-size-12);
    line-height: var(--line-height-none);
    transition: var(--transition-color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 24px;
    box-shadow: var(--shadow-elevation-sm);
    width: 70px;
}

.emoji-toggle-button:hover {
    background: var(--color-gray-dark);
}

.emoji-preview {
    letter-spacing: 2px;
}

.collapse-icon {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    line-height: var(--line-height-none);
}

.successes-content {
    padding: 1px var(--space-md);
    font-size: var(--font-size-14);
}

.successes-content :deep(p:first-child) {
    margin-top: 0;
}

/* Transition animations */
.expand-successes-enter-active,
.expand-successes-leave-active {
    transition: all var(--transition-medium);
    overflow: hidden;
}

.expand-successes-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.expand-successes-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    transform: translateY(-10px);
}

.expand-successes-enter-to,
.expand-successes-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
