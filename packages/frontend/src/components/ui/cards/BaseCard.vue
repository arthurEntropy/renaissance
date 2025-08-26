<template>
  <div ref="cardElement" class="base-card edit-hover-area" :class="{ collapsed: isCollapsed, collapsible: collapsible }"
    :style="cardStyle" @click="collapsible ? toggleCollapsed() : null">

    <!-- Floating Edit Button -->
    <EditButton v-if="editable" @click.stop="$emit('edit', item)" :title="`Edit ${itemType}`" size="small"
      visibility="on-hover" class="edit-button-floating" />

    <!-- Header Row -->
    <div class="card-header">
      <span v-if="collapsible" class="caret">{{ caretSymbol }}</span>
      <div class="name-container">
        <span class="item-name"><strong>{{ item.name }}</strong></span>
        <span v-if="sourceName && showSource" class="source-name">({{ sourceName }})</span>
      </div>
      <div class="item-info" v-if="metaInfo">
        <em>{{ metaInfo }}</em>
      </div>
    </div>

    <!-- Expandable Content -->
    <transition name="expand">
      <div v-if="!collapsible || !isCollapsed" class="card-content">
        <slot name="image"></slot>
        <slot name="description"></slot>
        <slot name="actions"></slot>
      </div>
    </transition>

    <!-- Overlay badges (XP, SOL, etc.) -->
    <slot name="badges"></slot>

    <!-- Footer content (engagement successes, etc.) -->
    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import EditButton from '@/components/ui/buttons/EditButton.vue'

const props = defineProps({
  item: { type: Object, required: true },
  itemType: { type: String, default: 'item' },
  metaInfo: { type: String, default: '' },
  storeInstance: { type: Object, required: false, default: null },
  initialCollapsed: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: true },
  showSource: { type: Boolean, default: true },
})

const emit = defineEmits(['edit', 'update', 'send-to-chat', 'height-changed', 'update:collapsed'])

// Source management
const sourcesStore = useSourcesStore()
const getSourceById = sourcesStore.getSourceById
const getSourceName = sourcesStore.getSourceName

// Template ref
const cardElement = ref(null)

// Reactive state
const isCollapsed = ref(props.initialCollapsed)
const sourceName = ref('')

// Computed properties
const caretSymbol = computed(() => (isCollapsed.value ? '▶' : '▼'))

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
  isCollapsed.value = !isCollapsed.value
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

watch(isCollapsed, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit('update:collapsed', newVal)
    nextTick(() => {
      setTimeout(() => {
        emit('height-changed')
      }, 300)
    })
  }
})

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
  margin-bottom: var(--space-sm);
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

.source-name {
  font-size: var(--font-size-14);
  font-style: italic;
  color: var(--color-gray-light);
  margin-left: var(--space-xs);
  vertical-align: middle;
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

.edit-button-floating {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  z-index: var(--z-interactive);
}
</style>
