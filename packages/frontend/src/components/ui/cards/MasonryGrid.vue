<template>
  <div class="masonry-grid" ref="masonryContainer">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Debounce function to limit rapid-fire resize events
function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
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
  let count = Math.floor((containerWidth + props.gap) / (props.columnWidth + props.gap))
  columnCount.value = Math.max(1, count)
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
  // cleanup first
  childResizeObservers.forEach((o) => o && o.disconnect())
  childResizeObservers = []

  const debouncedSetSpan = debounce((el) => setSpanForElement(el), 50)

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

  const debouncedUpdate = debounce(() => {
    calculateColumnCount()
    updateLayout()
  }, 50)

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

  nextTick(() => {
    setTimeout(() => {
      calculateColumnCount()
      updateLayout()
    }, 100)
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (mutationObserver) mutationObserver.disconnect()
  childResizeObservers.forEach((o) => o && o.disconnect())
  childResizeObservers = []
})

// expose updateLayout so parents can call via ref
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
  /* Prevent overflow from causing layout issues */
  /* Remove min-width and max-width constraints as we're setting exact width */
}
</style>
