<template>
    <div v-if="content || $slots.successes || $slots['before-description'] || $slots['after-description'] || $slots['below-description'] || $slots['top-badge']"
        class="card-description" :class="[additionalClasses, { 'has-top-badge': !!$slots['top-badge'] }]"
        @click="handleDescriptionClick">
        <!-- Bookmark badge for magic items/abilities -->
        <slot name="top-badge"></slot>

        <!-- Content to display before the description -->
        <slot name="before-description"></slot>

        <div class="text-stroke" v-html="safeContent"></div>
        <slot name="badge"></slot>

        <!-- Content to display directly below the description (e.g. biome tags), before after-description -->
        <slot name="below-description"></slot>

        <!-- Content to display after the description -->
        <slot name="after-description"></slot>

        <!-- Successes section (within same container) -->
        <slot name="successes"></slot>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { autoLinkifyRolls } from '@/utils/autoLinkifyRolls'

const props = defineProps({
    content: { type: String, required: true },
    additionalClasses: { type: [String, Array, Object], default: '' }
})

const emit = defineEmits(['roll-link'])

const safeContent = computed(() => {
    const sanitized = sanitizeHtml(props.content)
    return autoLinkifyRolls(sanitized)
})

function handleDescriptionClick(event) {
    const target = event.target

    // Check if click was on a roll link
    if (target.tagName === 'A' && target.classList.contains('roll-link')) {
        event.preventDefault()

        try {
            const rollData = JSON.parse(target.dataset.rollAction)
            emit('roll-link', rollData)
        } catch (err) {
            console.error('Failed to parse roll action data:', err)
        }
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.card-description {
    background-color: var(--overlay-black-heavy);
    padding: 0 var(--space-xs) var(--space-xs);
    border: 1px solid var(--overlay-black-heavy);
    border-radius: var(--radius-5);
    text-align: left;
    font-size: var(--font-size-14);
    position: relative;
    /* Raised bevel effect: light on top/left, dark on bottom/right */
    box-shadow:
        inset 1px 1px 6px var(--overlay-white-heavy),
        /* Light highlight top-left */
        inset -1px -1px 6px var(--overlay-black-medium);
    /* Dark shadow bottom-right */
}

.card-description>div {
    padding: 1px var(--space-md);
}

.card-description.has-top-badge {
    padding-top: var(--space-lg);
}

/* Scale embedded images to fit within description width */
.card-description :deep(img) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: var(--space-sm) auto;
}

/* Table styles */
.card-description :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: var(--space-sm) 0;
    font-size: var(--font-size-10);
    line-height: 1.2;
}

.card-description :deep(th),
.card-description :deep(td) {
    border: 1px solid var(--color-gray-medium);
    padding: 2px;
    text-align: left;
    vertical-align: middle;
}

.card-description :deep(th) {
    background-color: var(--color-gray-dark);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.card-description :deep(tr:nth-child(even) td) {
    background-color: var(--overlay-black-medium);
}

.card-description :deep(tr:nth-child(odd) td) {
    background-color: var(--color-gray-dark);
}

.card-description :deep(td p),
.card-description :deep(th p) {
    margin: 0;
    padding: 0;
}

/* Bulleted list styles */
.card-description :deep(ul) {
    padding-left: var(--space-lg);
    margin: var(--space-xs) 0;
}

.card-description :deep(ul:last-child) {
    margin-bottom: var(--space-lg);
}

.card-description :deep(ul li) {
    margin-bottom: var(--space-xs);
}

.card-description :deep(ul li p) {
    margin: 0;
    padding: 0;
}

/* Auto-linkified roll links */
.card-description :deep(.roll-link) {
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
}

.card-description :deep(.roll-link:hover) {
    color: var(--color-accent-gold);
}
</style>
