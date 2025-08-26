<template>
  <div class="selection-card" @click="$emit('select', concept)">
    <div v-if="concept.expansionLogoUrl" class="expansion-logo-badge-wrapper">
      <img :src="concept.expansionLogoUrl" alt="Expansion Logo" class="expansion-logo-badge" />
    </div>
    <img :src="concept.artUrls[0]" :alt="concept.name" class="selection-card-image" />
    <p class="selection-card-name">{{ concept.name }}</p>
  </div>
</template>

<script setup>
defineProps({
  concept: { type: Object, required: true },
})

defineEmits(['select'])
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.selection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: var(--space-md);
  padding: var(--space-xl);
  border-radius: var(--radius-5);
  background-color: var(--overlay-black-heavy);
  cursor: pointer;
  width: 200px;
  position: relative;
  box-shadow: var(--shadow-glow-sm);
}

/* White glow on hover */
.selection-card:hover {
  box-shadow: var(--shadow-glow-lg);
  transition: box-shadow var(--transition-normal) ease;
}

.selection-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  object-position: top;
  margin-bottom: var(--space-sm);
}

.selection-card-name {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-normal);
  text-align: center;
  max-width: 200px;
  margin: 0;
}

/* Expansion logo badge */
.expansion-logo-badge-wrapper {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  z-index: var(--z-raised);
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.expansion-logo-badge {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-elevation-sm);
  background: var(--color-gray-dark);
  object-fit: cover;
  border: 2px solid var(--color-gray-dark);
}
</style>
