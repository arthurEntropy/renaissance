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
        <!-- Move large image inside the collapsible area -->
        <slot name="large-image"></slot>
        <slot name="content"></slot>
        <slot name="buttons"></slot>
      </div>
    </transition>

    <!-- XP or other badge -->
    <slot name="badge"></slot>

    <!-- Footer Slot -->
    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import EditButton from '@/components/EditButton.vue'

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
  return { background: 'rgba(0, 0, 0, 0.85)' }
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
.base-card {
  border: 1px solid var(--color-gray-medium);
  border-radius: 8px;
  padding: 10px;
  margin-top: 5px;
  transition:
    background-color 0.3s ease,
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
  z-index: 1;
  pointer-events: none;
}

.base-card>* {
  position: relative;
  z-index: 2;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.base-card.collapsed .card-header {
  margin-bottom: 0;
}

.base-card.collapsible {
  cursor: pointer;
}

.caret {
  margin-right: 10px;
  font-size: 16px;
  height: 20px;
  width: 20px;
  text-shadow:
    -1px -1px 0 var(--color-black),
    1px -1px 0 var(--color-black),
    -1px 1px 0 var(--color-black),
    1px 1px 0 var(--color-black);
}

.name-container {
  flex: 1;
  margin-right: 10px;
  display: flex;
  align-items: center;
  position: relative;
}

.item-name {
  font-size: 16px;
  text-shadow:
    -1px -1px 0 var(--color-black),
    1px -1px 0 var(--color-black),
    -1px 1px 0 var(--color-black),
    1px 1px 0 var(--color-black);
  word-wrap: break-word;
}

.source-name {
  font-size: 0.7em;
  font-style: italic;
  color: var(--color-gray-light);
  margin-left: 6px;
  vertical-align: middle;
}

.item-info {
  font-size: 13px;
  color: var(--color-white);
  text-shadow:
    -1px -1px 0 var(--color-black),
    1px -1px 0 var(--color-black),
    -1px 1px 0 var(--color-black),
    1px 1px 0 var(--color-black);
  font-weight: 500;
  letter-spacing: 0.01em;
  margin-left: 8px;
  margin-right: 0;
}

.edit-button-floating {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 10;
}
</style>
