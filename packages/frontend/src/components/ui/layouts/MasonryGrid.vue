<template>
  <div class="masonry-grid" ref="masonryContainer">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Debounce utility to limit rapid-fire resize events
function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

const props = defineProps({
  columnWidth: { type: Number, default: 300 },
  gap: { type: Number, default: 10 },
  rowHeight: { type: Number, default: 10 },
})

const masonryContainer = ref(null)
let resizeObserver = null
let mutationObserver = null
let childResizeObservers = []
const columnCount = ref(1)

function calculateColumnCount() {
  const containerWidth = masonryContainer.value?.clientWidth || 0
  const availableColumns = Math.floor((containerWidth + props.gap) / (props.columnWidth + props.gap))
  columnCount.value = Math.max(1, availableColumns)
}

function initMasonry() {
  const container = masonryContainer.value
  if (!container) return

  container.style.display = 'grid'
  container.style.gridAutoRows = `${props.rowHeight}px`
  container.style.gap = `${props.gap}px`
  container.style.position = 'relative'

  calculateColumnCount()
  container.style.gridTemplateColumns = `repeat(${columnCount.value}, ${props.columnWidth}px)`
  container.style.justifyContent = 'center'

  nextTick(() => {
    updateLayout()
  })
}

function updateLayout() {
  const container = masonryContainer.value
  if (!container) return

  container.style.gridTemplateColumns = `repeat(${columnCount.value}, ${props.columnWidth}px)`
  Array.from(container.children).forEach((child) => setSpanForElement(child))
}

function setSpanForElement(element) {
  if (!element || element.offsetParent === null) return
  element.style.width = `${props.columnWidth}px`
  const height = element.getBoundingClientRect().height
  const rowSpan = Math.ceil((height + props.gap) / (props.rowHeight + props.gap))
  element.style.gridRowEnd = `span ${rowSpan}`
}

function observeChildElements() {
  // Clean up existing observers
  childResizeObservers.forEach((observer) => observer && observer.disconnect())
  childResizeObservers = []

  const RESIZE_DEBOUNCE_DELAY = 50
  const debouncedSetSpan = debounce((element) => setSpanForElement(element), RESIZE_DEBOUNCE_DELAY)

  const children = Array.from(masonryContainer.value?.children || [])
  children.forEach((child) => {
    child.style.width = `${props.columnWidth}px`
    const observer = new ResizeObserver(() => debouncedSetSpan(child))
    observer.observe(child)
    childResizeObservers.push(observer)
  })
}

onMounted(() => {
  initMasonry()

  const LAYOUT_UPDATE_DEBOUNCE_DELAY = 50
  const debouncedUpdate = debounce(() => {
    calculateColumnCount()
    updateLayout()
  }, LAYOUT_UPDATE_DEBOUNCE_DELAY)

  resizeObserver = new ResizeObserver(debouncedUpdate)
  if (masonryContainer.value) resizeObserver.observe(masonryContainer.value)

  mutationObserver = new MutationObserver(() => {
    debouncedUpdate()
    observeChildElements()
  })
  if (masonryContainer.value) {
    mutationObserver.observe(masonryContainer.value, { childList: true, subtree: false })
  }

  observeChildElements()

  // Allow DOM to settle before final layout calculation
  nextTick(() => {
    const INITIAL_LAYOUT_DELAY = 100
    setTimeout(() => {
      calculateColumnCount()
      updateLayout()
    }, INITIAL_LAYOUT_DELAY)
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (mutationObserver) mutationObserver.disconnect()
  childResizeObservers.forEach((observer) => observer && observer.disconnect())
  childResizeObservers = []
})

// Expose updateLayout so parents can call via ref
defineExpose({ updateLayout })
</script>

<style scoped>
.masonry-grid {
  width: 100%;
  align-items: start;
  box-sizing: border-box;
  min-height: 100px;
}

.masonry-grid>* {
  box-sizing: border-box;
  overflow: hidden;
}
</style>
