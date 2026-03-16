<template>
  <div class="info-card">
    <div class="info-card-header">
      <div class="info-card-title">{{ title }}</div>
      <slot name="title-actions"></slot>
    </div>
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
  border-radius: var(--radius-10);
  padding: var(--space-lg);
  margin-bottom: var(--space-xs);
  width: 100%;
  box-sizing: border-box;
}

.info-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-accent-gold);
  padding-bottom: var(--space-xs);
  margin-bottom: var(--space-xs);
  gap: var(--space-sm);
}

.info-card-title {
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-gold);
  font-size: var(--font-size-20);
}

.info-card-content {
  color: var(--color-text-primary);
  white-space: pre-line;
  line-height: var(--line-height-normal);
}
</style>
