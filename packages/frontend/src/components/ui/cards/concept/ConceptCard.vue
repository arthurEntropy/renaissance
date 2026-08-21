<template>
  <div class="concept-card" role="button" tabindex="0" :aria-label="`Select ${concept.name}`"
    @click="$emit('select', concept)" @keydown.enter="$emit('select', concept)"
    @keydown.space.prevent="$emit('select', concept)">
    <img v-if="expansionLogoUrl" :src="expansionLogoUrl" alt="Expansion Logo" class="expansion-logo-badge" />
    <span v-if="concept.characterType === 'beast'" class="challenge-badge">
      {{ concept.challenge ?? 0 }}
    </span>
    <img v-if="conceptArtUrl" :src="optimizedConceptArtUrl" :alt="`${concept.name} concept art`"
      class="concept-card-image" />
    <p ref="nameRef" class="concept-card-name">{{ concept.name }}</p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
  concept: { type: Object, required: true },
  expansions: { type: Array, default: () => [] },
})

const conceptArtUrl = computed(() => props.concept.featuredArtUrls?.[0] || '')

// Optimize concept art URL
const optimizedConceptArtUrl = useOptimizedImage(() => conceptArtUrl.value, MIDJOURNEY_IMAGE_CONTEXTS.SMALL)

const expansionLogoUrl = computed(() => {
  const expansion = props.expansions.find(e => e.id === props.concept.expansion)
  return expansion?.logoUrl || ''
})

defineEmits(['select'])

const nameRef = ref(null)

const NAME_MAX_PX = 20
const NAME_MIN_PX = 11

function fitNameText() {
  const nameEl = nameRef.value
  if (!nameEl) return
  nameEl.style.fontSize = `${NAME_MAX_PX}px`
  const lh = parseFloat(getComputedStyle(nameEl).lineHeight)
  const lineHeight = isNaN(lh) ? NAME_MAX_PX * 1.4 : lh
  const maxHeight = lineHeight * 1
  while (nameEl.scrollHeight > maxHeight && parseFloat(nameEl.style.fontSize) > NAME_MIN_PX) {
    nameEl.style.fontSize = `${parseFloat(nameEl.style.fontSize) - 0.5}px`
  }
}

watch(() => props.concept.name, async () => {
  await nextTick()
  fitNameText()
})

onMounted(async () => {
  await nextTick()
  fitNameText()
})
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
  box-shadow: var(--glow-lg);
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
  box-shadow: var(--shadow-sm);
  background: var(--color-gray-dark);
  object-fit: cover;
  border: 2px solid var(--color-gray-dark);
  pointer-events: none;
}

.challenge-badge {
  position: absolute;
  bottom: 0;
  right: 12px;
  transform: translateY(50%);
  z-index: var(--z-raised);
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--color-danger-hover);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--color-gray-dark);
  pointer-events: none;
}
</style>
