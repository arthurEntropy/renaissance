<template>
  <div class="masonry-grid" ref="masonryContainer">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  columnWidth: { type: Number, default: 300 },
  gap: { type: Number, default: 10 },
  rowHeight: { type: Number, default: 10 },
})

const masonryContainer = ref(null)
let resizeObserver = null
let mutationObserver = null

function calculateColumnCount() {
  const containerWidth = masonryContainer.value?.clientWidth || 0
  const availableColumns = Math.floor((containerWidth + props.gap) / (props.columnWidth + props.gap))
  return Math.max(1, availableColumns)
}

function setSpanForElement(element) {
  if (!element || element.offsetParent === null) return
  const height = element.getBoundingClientRect().height
  const rowSpan = Math.ceil((height + props.gap) / (props.rowHeight + props.gap))
  element.style.gridRowEnd = `span ${rowSpan}`
}

function updateLayout() {
  const container = masonryContainer.value
  if (!container) return

  const columnCount = calculateColumnCount()
  container.style.gridTemplateColumns = `repeat(${columnCount}, ${props.columnWidth}px)`

  // Update row spans for all children
  Array.from(container.children).forEach((child) => setSpanForElement(child))
}

function initMasonry() {
  const container = masonryContainer.value
  if (!container) return

  container.style.display = 'grid'
  container.style.gridAutoRows = `${props.rowHeight}px`
  container.style.gap = `${props.gap}px`
  container.style.justifyContent = 'center'

  nextTick(() => {
    updateLayout()
  })
}

onMounted(() => {
  initMasonry()

  // Watch for container width changes (window resize, sidebar toggle, etc.)
  resizeObserver = new ResizeObserver(() => {
    updateLayout()
  })

  if (masonryContainer.value) {
    resizeObserver.observe(masonryContainer.value)
  }

  // Watch for content changes within children (e.g., improvements expanding/collapsing)
  // This triggers when DOM changes happen inside cards, not just when cards are added/removed
  mutationObserver = new MutationObserver(() => {
    // Recalculate layout when card content changes
    updateLayout()
  })

  if (masonryContainer.value) {
    mutationObserver.observe(masonryContainer.value, {
      childList: true,  // Watch for cards being added/removed
      subtree: true,    // Watch for changes inside cards (improvements expanding)
      attributes: true, // Watch for attribute changes that might affect height
      attributeFilter: ['class', 'style'] // Only watch relevant attributes
    })
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
})

// Expose updateLayout for manual layout recalculation if needed
defineExpose({ updateLayout })
</script>
<style scoped>
.masonry-grid {
  width: 100%;
  align-items: start;
  box-sizing: border-box;
}

.masonry-grid>* {
  box-sizing: border-box;
}
</style>
