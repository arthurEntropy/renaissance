<template>
    <div v-if="content" class="description-background" :class="additionalClasses">
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
.description-background {
    background-color: var(--overlay-black-heavy);
    padding: 1px 10px;
    border-radius: var(--radius-5);
    text-align: left;
    font-size: var(--font-size-14);
    position: relative;
}

.description-background.small {
    padding: 1px 10px;
    font-size: var(--font-size-13);
}

.description-background.large {
    padding: 15px;
    font-size: var(--font-size-16);
}

.description-background.improvement {
    padding: 1px 10px 6px 10px;
    font-size: var(--font-size-13);
    margin-top: 2px;
    min-height: 24px;
}
</style>
