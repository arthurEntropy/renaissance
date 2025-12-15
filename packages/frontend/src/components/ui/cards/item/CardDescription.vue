<template>
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
    additionalClasses: { type: [String, Array, Object], default: '' }
})

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
</style>
