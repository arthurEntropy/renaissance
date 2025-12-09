<template>
    <div v-if="content" class="card-description" :class="[additionalClasses, { 'has-overlay': hasOverlay }]">
        <div v-html="safeContent"></div>
        <slot name="badge"></slot>
        <slot name="overlay"></slot>
    </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
    content: { type: String, required: true },
    additionalClasses: { type: [String, Array, Object], default: '' }
})

const slots = useSlots()
const hasOverlay = computed(() => !!slots.overlay)
const safeContent = computed(() => sanitizeHtml(props.content))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.card-description {
    background-color: var(--overlay-black-medium);
    padding: 1px var(--space-lg);
    border-radius: var(--radius-5);
    text-align: left;
    font-size: var(--font-size-14);
    position: relative;
}

.card-description.has-overlay:hover :deep(.add-ability-overlay) {
    opacity: 1;
    pointer-events: all;
}
</style>
