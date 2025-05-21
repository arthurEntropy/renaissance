<template>
  <div class="info-card">
    <div class="info-card-title">{{ title }}</div>
    <div class="info-card-content" v-html="content"></div>
    <slot name="additional-content"></slot>
  </div>
</template>

<script>
export default {
  name: 'InfoCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
  },
}
</script>

<style scoped>
.info-card {
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.info-card-title {
  font-weight: bold;
  color: #ffd700;
  font-size: 1.2rem;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 4px;
}

.info-card-content {
  color: #e0e0e0;
  white-space: pre-line;
  line-height: 1.4;
}
</style>
