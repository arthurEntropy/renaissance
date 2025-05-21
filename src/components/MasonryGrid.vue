<template>
  <div class="masonry-grid" ref="masonryContainer">
    <slot></slot>
  </div>
</template>

<script>
// Debounce function to limit rapid-fire resize events
function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export default {
  name: 'MasonryGrid',
  props: {
    columnWidth: {
      type: Number,
      default: 300,
    },
    gap: {
      type: Number,
      default: 10,
    },
    rowHeight: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      resizeObserver: null,
      mutationObserver: null,
      childResizeObservers: [],
      columnCount: 1,
    }
  },
  mounted() {
    this.initMasonry()

    // Debounced update function to prevent too many rapid updates
    const debouncedUpdate = debounce(() => {
      this.calculateColumnCount()
      this.updateLayout()
    }, 50)

    // Create a ResizeObserver to handle container resizing
    this.resizeObserver = new ResizeObserver(debouncedUpdate)
    this.resizeObserver.observe(this.$refs.masonryContainer)

    // Create a MutationObserver to watch for child elements being added or removed
    this.mutationObserver = new MutationObserver(() => {
      debouncedUpdate()
      this.observeChildElements()
    })
    this.mutationObserver.observe(this.$refs.masonryContainer, {
      childList: true,
      subtree: false,
    })

    // Initial observation of child elements
    this.observeChildElements()

    // Initial layout after a slight delay to ensure DOM is ready
    this.$nextTick(() => {
      setTimeout(() => {
        this.calculateColumnCount()
        this.updateLayout()
      }, 100)
    })
  },
  beforeUnmount() {
    // Clean up observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }

    // Disconnect all child observers
    this.childResizeObservers.forEach((observer) => {
      if (observer) observer.disconnect()
    })
  },
  methods: {
    calculateColumnCount() {
      // Calculate how many columns can fit based on container width
      const containerWidth = this.$refs.masonryContainer.clientWidth
      // Total width of each column including gap = columnWidth + gap
      // First column has no left gap, last column has no right gap
      // So total width needed = (columnWidth * columnCount) + (gap * (columnCount - 1))
      // Solving for columnCount: columnCount = (containerWidth + gap) / (columnWidth + gap)
      let columnCount = Math.floor(
        (containerWidth + this.gap) / (this.columnWidth + this.gap),
      )
      columnCount = Math.max(1, columnCount) // Ensure at least one column
      this.columnCount = columnCount
    },

    initMasonry() {
      const container = this.$refs.masonryContainer

      // Apply grid styles - we'll use a repeat with a fixed column width instead of auto-fill
      container.style.display = 'grid'
      container.style.gridAutoRows = `${this.rowHeight}px`
      container.style.gap = `${this.gap}px` // This sets both row and column gap
      container.style.position = 'relative'

      // Initially calculate column count
      this.calculateColumnCount()
      container.style.gridTemplateColumns = `repeat(${this.columnCount}, ${this.columnWidth}px)`

      // Make the container center the grid
      container.style.justifyContent = 'center'

      // Initial layout update
      this.$nextTick(() => {
        this.updateLayout()
      })
    },

    updateLayout() {
      const container = this.$refs.masonryContainer

      // Update the grid template columns based on recalculated column count
      container.style.gridTemplateColumns = `repeat(${this.columnCount}, ${this.columnWidth}px)`

      // Calculate spans for all child elements
      Array.from(container.children).forEach((child) => {
        this.setSpanForElement(child)
      })
    },

    setSpanForElement(element) {
      // Make sure the element is visible and rendered
      if (element.offsetParent === null) return

      // Set the element to exact column width
      element.style.width = `${this.columnWidth}px`

      // Get the height and calculate how many rows it should span
      const height = element.getBoundingClientRect().height
      const rowSpan = Math.ceil(
        (height + this.gap) / (this.rowHeight + this.gap),
      )

      // Apply the span
      element.style.gridRowEnd = `span ${rowSpan}`
    },

    observeChildElements() {
      // Clean up previous observers first
      this.childResizeObservers.forEach((observer) => {
        if (observer) observer.disconnect()
      })
      this.childResizeObservers = []

      // Debounced setter to prevent too many rapid updates
      const debouncedSetSpan = debounce((element) => {
        this.setSpanForElement(element)
      }, 50)

      // Create new observers for each child
      const children = Array.from(this.$refs.masonryContainer.children)
      children.forEach((child) => {
        // Set initial width
        child.style.width = `${this.columnWidth}px`

        const observer = new ResizeObserver(() => {
          debouncedSetSpan(child)
        })
        observer.observe(child)
        this.childResizeObservers.push(observer)
      })
    },
  },
}
</script>

<style scoped>
.masonry-grid {
  width: 100%;
  align-items: start;
  box-sizing: border-box;
  min-height: 100px;
}

.masonry-grid > * {
  box-sizing: border-box;
  overflow: hidden; /* Prevent overflow from causing layout issues */
  /* Remove min-width and max-width constraints as we're setting exact width */
}
</style>
