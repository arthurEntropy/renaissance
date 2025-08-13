<template>
  <div class="info-card">
    <div class="info-card-title">{{ title }}</div>
    <div class="info-card-content" v-html="safeContent"></div>
    <slot name="additional-content"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
  title: { type: String, required: true },
  content: { type: String, default: '' },
})

const safeContent = computed(() => sanitizeHtml(props.content))
</script>

<style scoped>
.info-card {
  background: var(--overlay-black-medium);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.info-card-title {
  font-weight: bold;
  color: var(--color-accent-gold);
  font-size: 1.2rem;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-accent-gold);
  padding-bottom: 4px;
}

.info-card-content {
  color: var(--color-text-primary);
  white-space: pre-line;
  line-height: 1.4;
}
</style>
