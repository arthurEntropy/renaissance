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
    border-radius: 5px;
    text-align: left;
    font-size: 14px;
    position: relative;
}

.description-background.small {
    padding: 1px 10px;
    font-size: 13px;
}

.description-background.large {
    padding: 15px;
    font-size: 16px;
}

.description-background.improvement {
    padding: 1px 10px 6px 10px;
    font-size: 13px;
    margin-top: 2px;
    min-height: 24px;
}
</style>
