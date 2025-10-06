<template>
  <div ref="cardElement" class="base-card edit-hover-area" :class="{ collapsed: collapsed, collapsible: collapsible }"
    :style="cardStyle" @click="collapsible ? toggleCollapsed() : null">

    <!-- Floating Action Buttons -->
    <div v-if="editable || duplicatable" class="floating-buttons">
      <DuplicateButton v-if="duplicatable" @click.stop="$emit('duplicate', item)" :title="`Duplicate ${itemType}`"
        size="small" visibility="on-hover" class="duplicate-button-floating" />
      <EditButton v-if="editable" @click.stop="$emit('edit', item)" :title="`Edit ${itemType}`" size="small"
        visibility="on-hover" class="edit-button-floating" />
    </div>

    <!-- Default slot for custom overlays -->
    <slot></slot>

    <!-- Header Row -->
    <div class="card-header">
      <span v-if="collapsible" class="caret">{{ caretSymbol }}</span>
      <div class="name-container">
        <span class="item-name" :title="sourceName && showSource ? `Source: ${sourceName}` : null">
          <strong>{{ item.name }}</strong>
        </span>
      </div>
      <div class="item-info" v-if="metaInfo">
        <em>{{ metaInfo }}</em>
      </div>
    </div>

    <!-- Category/Subtitle slot just under the name -->
    <div class="categories">
      <slot name="category"></slot>
    </div>

    <!-- Expandable Content -->
    <transition name="expand">
      <div v-if="!collapsible || !collapsed" class="card-content">
        <slot name="image"></slot>
        <slot name="description"></slot>
        <slot name="actions"></slot>
      </div>
    </transition>

    <!-- Overlay badges (XP, Keeping) -->
    <slot name="badges"></slot>

    <!-- Footer content (engagement successes, etc.) -->
    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import EditButton from '@/components/ui/buttons/EditButton.vue'
import DuplicateButton from '@/components/ui/buttons/DuplicateButton.vue'

const props = defineProps({
  item: { type: Object, required: true },
  itemType: { type: String, default: 'item' },
  metaInfo: { type: String, default: '' },
  storeInstance: { type: Object, required: false, default: null },
  collapsed: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  duplicatable: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: true },
  showSource: { type: Boolean, default: true },
})

const emit = defineEmits(['edit', 'duplicate', 'update', 'send-to-chat', 'height-changed', 'update:collapsed'])

// Source management
const sourcesStore = useSourcesStore()
const getSourceById = sourcesStore.getSourceById
const getSourceName = sourcesStore.getSourceName

// Template ref
const cardElement = ref(null)

// Reactive state
const sourceName = ref('')

// Computed properties
const caretSymbol = computed(() => (props.collapsed ? '▶' : '▼'))

const cardStyle = computed(() => {
  // First check for item's own background
  if (props.item.backgroundImage) {
    return {
      backgroundImage: `url(${props.item.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'top center',
    }
  }

  // Then check source's background
  const source = getSourceById(props.item.source)
  if (source && source.backgroundImage) {
    return {
      backgroundImage: `url(${source.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  // Fallback
  return { background: 'var(--overlay-black-heavy)' }
})

// Methods
const toggleCollapsed = () => {
  const newCollapsed = !props.collapsed

  if (newCollapsed) {
    // Card is collapsing - start animation immediately, then notify masonry
    emit('update:collapsed', newCollapsed)
    setTimeout(() => {
      emit('height-changed')
    }, 550) // After animation completes (500ms + buffer)
  } else {
    // Card is expanding - instantly show content (invisible), then notify masonry
    emit('update:collapsed', newCollapsed)

    // Wait for DOM to update, then notify masonry
    setTimeout(() => {
      emit('height-changed')
    }, 10) // Just enough time for DOM to update
  }
}

const setSpanSize = () => {
  if (!cardElement.value) return
  const rowHeight = 10
  const height = cardElement.value.getBoundingClientRect().height
  const rowSpan = Math.ceil(height / rowHeight)
  cardElement.value.style.setProperty('--card-span', rowSpan)
}

const updateSourceName = () => {
  if (!props.item.source) {
    sourceName.value = 'Unknown'
    return
  }
  sourceName.value = getSourceName(props.item.source)
}

// Watchers
watch(
  () => props.item.source,
  () => {
    updateSourceName()
  },
  { immediate: true },
)

watch(
  sourcesStore.sources,
  () => {
    updateSourceName()
  },
  { immediate: true },
)

// Lifecycle
onMounted(() => {
  nextTick(() => {
    setSpanSize()
  })
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.base-card {
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-10);
  padding: var(--space-md);
  margin-top: var(--space-xs);
  transition:
    background-color var(--transition-normal) ease,
    transform 0.2s ease;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  background-position: top center !important;
}

.base-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-black-medium);
  z-index: var(--z-overlay);
  pointer-events: none;
}

.base-card>* {
  position: relative;
  z-index: var(--z-raised);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.base-card.collapsed .card-header {
  margin-bottom: 0;
}

.base-card.collapsible {
  cursor: pointer;
}

.caret {
  margin-right: var(--space-sm);
  font-size: var(--font-size-16);
  height: 20px;
  width: 20px;
  text-shadow: var(--text-shadow-outline);
}

.name-container {
  flex: 1;
  margin-right: var(--space-sm);
  display: flex;
  align-items: center;
  position: relative;
}

.item-name {
  font-size: var(--font-size-16);
  text-shadow: var(--text-shadow-outline);
  word-wrap: break-word;
}

.item-info {
  font-size: var(--font-size-13);
  color: var(--color-white);
  text-shadow: var(--text-shadow-outline);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.01em;
  margin-left: var(--space-xs);
  margin-right: 0;
}

.floating-buttons {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  z-index: var(--z-interactive);
  display: flex;
  gap: var(--space-xs);
}

.edit-button-floating,
.duplicate-button-floating {
  /* Positioning handled by parent .floating-buttons container */
  position: static;
}

/* Expand/Collapse transition for card content */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
}

.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
  /* Large enough for typical card content */
  transform: translateY(0);
}

.categories {
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  text-shadow: var(--text-shadow-outline);
}
</style>
