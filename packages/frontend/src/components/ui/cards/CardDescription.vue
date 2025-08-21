<template>
    <!-- 
      CardDescription - Standardized description renderer with badge support
      
      Features:
      - HTML content sanitization
      - Size variants (normal, small, large)
      - Badge slot overlay for absolute-positioned badges
      - Consistent background and styling
      
      Badge Slot Usage:
      - Use for BadgeDisplay components that need absolute positioning
      - Badges will overlay content with proper z-index
      - Standard pattern: <BadgeDisplay :xp="data.xp" :sol="data.sol" />
    -->
    <div v-if="content" class="card-description" :class="additionalClasses">
        <div v-html="safeContent"></div>
        <slot name="badge"></slot>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
    content: { type: String, required: true },
    additionalClasses: { type: [String, Array, Object], default: '' },
    size: { type: String, default: 'normal', validator: (v) => ['small', 'normal', 'large'].includes(v) }
})

const safeContent = computed(() => sanitizeHtml(props.content))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.card-description {
    background-color: var(--overlay-black-heavy);
    padding: 1px var(--space-sm);
    border-radius: var(--radius-5);
    text-align: left;
    font-size: var(--font-size-14);
    position: relative;
}

.card-description.small {
    padding: 1px var(--space-sm);
    font-size: var(--font-size-13);
}

.card-description.large {
    padding: var(--space-lg);
    font-size: var(--font-size-16);
}

.card-description.improvement {
    padding: 1px var(--space-sm) var(--space-xs) var(--space-sm);
    font-size: var(--font-size-13);
    margin-top: var(--space-xs);
    min-height: 24px;
}
</style>
