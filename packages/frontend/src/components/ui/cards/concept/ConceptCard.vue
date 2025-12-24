<template>
  <div class="concept-card" role="button" tabindex="0" :aria-label="`Select ${concept.name}`"
    @click="$emit('select', concept)" @keydown.enter="$emit('select', concept)"
    @keydown.space.prevent="$emit('select', concept)">
    <img v-if="expansionLogoUrl" :src="expansionLogoUrl" alt="Expansion Logo" class="expansion-logo-badge" />
    <img v-if="concept.artUrls?.[0]" :src="concept.artUrls[0]" :alt="`${concept.name} concept art`"
      class="concept-card-image" />
    <p class="concept-card-name">{{ concept.name }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  concept: { type: Object, required: true },
  expansions: { type: Array, default: () => [] },
})

const expansionLogoUrl = computed(() => {
  const expansion = props.expansions.find(e => e.id === props.concept.expansion)
  return expansion?.logoUrl || ''
})

defineEmits(['select'])
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.concept-card {
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
  transition: box-shadow var(--transition-normal) ease;
}

.concept-card:hover {
  box-shadow: var(--shadow-glow-lg);
}

.concept-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  object-position: top;
  margin-bottom: var(--space-sm);
}

.concept-card-name {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-normal);
  text-align: center;
  margin: 0;
}

.expansion-logo-badge {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  z-index: var(--z-raised);
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-elevation-sm);
  background: var(--color-gray-dark);
  object-fit: cover;
  border: 2px solid var(--color-gray-dark);
  pointer-events: none;
}
</style>
