<template>
    <div v-if="content" class="card-description" :class="additionalClasses">
        <div class="text-stroke" v-html="safeContent"></div>
        <slot name="badge"></slot>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
    content: { type: String, required: true },
    additionalClasses: { type: [String, Array, Object], default: '' }
})

const safeContent = computed(() => sanitizeHtml(props.content))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.card-description {
    background-color: var(--overlay-black-heavy);
    padding: 0 var(--space-xs);
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
</style>
