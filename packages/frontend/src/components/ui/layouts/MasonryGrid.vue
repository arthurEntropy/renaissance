<template>
  <div class="masonry-grid" ref="masonryContainer">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const LAYOUT_UPDATE_DEBOUNCE_MS = 100

const props = defineProps({
  gap: { type: Number, default: 10 },
  rowHeight: { type: Number, default: 10 },
  justifyContent: { type: String, default: 'center' },
})

const masonryContainer = ref(null)
let resizeObserver = null
let mutationObserver = null
let layoutUpdateTimeout = null

function setSpanForElement(element) {
  if (!element || element.offsetParent === null) return
  const height = element.getBoundingClientRect().height
  const rowSpan = Math.ceil((height + props.gap) / (props.rowHeight + props.gap))
  element.style.gridRowEnd = `span ${rowSpan}`
}

function updateLayoutImmediate() {
  const container = masonryContainer.value
  if (!container) return

  container.style.justifyContent = props.justifyContent

  // Update row spans for all children
  Array.from(container.children).forEach((child) => setSpanForElement(child))
}

function updateLayout() {
  // Debounced layout update to prevent flickering
  if (layoutUpdateTimeout) {
    clearTimeout(layoutUpdateTimeout)
  }
  layoutUpdateTimeout = setTimeout(() => {
    updateLayoutImmediate()
    layoutUpdateTimeout = null
  }, LAYOUT_UPDATE_DEBOUNCE_MS)
}

function initMasonry() {
  const container = masonryContainer.value
  if (!container) return

  container.style.gridAutoRows = `${props.rowHeight}px`
  container.style.gap = `${props.gap}px`
  container.style.justifyContent = props.justifyContent

  nextTick(() => {
    updateLayoutImmediate()
  })
}

onMounted(() => {
  initMasonry()

  // Watch for container width changes (window resize, sidebar toggle, etc.)
  resizeObserver = new ResizeObserver(() => {
    updateLayoutImmediate()
  })

  if (masonryContainer.value) {
    resizeObserver.observe(masonryContainer.value)
  }

  // Watch for content changes within children (e.g., improvements expanding/collapsing)
  // This triggers when DOM changes happen inside cards, not just when cards are added/removed
  mutationObserver = new MutationObserver((mutations) => {
    // Recalculate layout when card content changes
    updateLayout()

    // Watch for newly added images and attach load handlers
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          const images = node.querySelectorAll ? node.querySelectorAll('img') : []
          images.forEach(img => {
            if (!img.complete) {
              img.addEventListener('load', handleImageLoad, { once: true })
            }
          })
        }
      })
    })
  })

  if (masonryContainer.value) {
    mutationObserver.observe(masonryContainer.value, {
      childList: true,  // Watch for cards being added/removed
      subtree: true,    // Watch for changes inside cards (improvements expanding)
      attributes: true, // Watch for attribute changes that might affect height
      attributeFilter: ['class', 'style'] // Only watch relevant attributes
    })

    // Attach load handlers to existing images
    const existingImages = masonryContainer.value.querySelectorAll('img')
    existingImages.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', handleImageLoad, { once: true })
      }
    })
  }
})

onBeforeUnmount(() => {
  if (layoutUpdateTimeout) {
    clearTimeout(layoutUpdateTimeout)
    layoutUpdateTimeout = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
})

function handleImageLoad() {
  // Recalculate layout when an image loads
  nextTick(() => {
    updateLayout()
  })
}

// Expose updateLayout for manual layout recalculation if needed
defineExpose({ updateLayout })
</script>
<style scoped>
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--card-width));
  width: 100%;
  align-items: start;
  box-sizing: border-box;
}

.masonry-grid>* {
  box-sizing: border-box;
}
</style>
