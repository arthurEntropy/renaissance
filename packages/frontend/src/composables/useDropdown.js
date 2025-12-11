import { ref, nextTick, onUnmounted } from 'vue'

// Constants
const VIEWPORT_PADDING = 10 // Minimum distance from viewport edges, in pixels
const DROPDOWN_GAP = 5 // Gap between trigger and dropdown, in pixels

export function useDropdown(options = {}) {
  const {
    viewportPadding = VIEWPORT_PADDING,
    gap = DROPDOWN_GAP
  } = options

  // State
  const isOpen = ref(false)
  const position = ref({ x: 0, y: 0 })
  const outsideClickListener = ref(null)
  const scrollListener = ref(null)
  const triggerElement = ref(null)
  const dropdownElement = ref(null)

  const updatePosition = () => {
    if (!triggerElement.value) return
    
    const triggerRect = triggerElement.value.getBoundingClientRect()
    
    // Position dropdown below the button
    position.value = {
      x: triggerRect.left,
      y: triggerRect.bottom + gap
    }
  }

  const close = () => {
    isOpen.value = false
    triggerElement.value = null
    dropdownElement.value = null
    
    if (outsideClickListener.value) {
      document.removeEventListener('click', outsideClickListener.value)
      outsideClickListener.value = null
    }
    
    if (scrollListener.value) {
      window.removeEventListener('scroll', scrollListener.value, true)
      scrollListener.value = null
    }
  }

  const adjustPosition = () => {
    if (!dropdownElement.value || !triggerElement.value) return

    const dropdownRect = dropdownElement.value.getBoundingClientRect()
    const triggerRect = triggerElement.value.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    
    let newX = position.value.x
    let newY = position.value.y

    // Vertical positioning: flip above trigger if it extends beyond bottom
    if (dropdownRect.bottom > windowHeight - viewportPadding) {
      // Position above the trigger button instead of below it
      newY = triggerRect.top - dropdownRect.height - gap
      
      // If still doesn't fit, use max available space
      if (newY < viewportPadding) {
        newY = viewportPadding
      }
    }

    // Horizontal positioning: keep within viewport bounds
    if (dropdownRect.right > windowWidth - viewportPadding) {
      newX = Math.max(viewportPadding, windowWidth - dropdownRect.width - viewportPadding)
    }
    
    if (dropdownRect.left < viewportPadding) {
      newX = viewportPadding
    }
    
    // Update position if changed
    if (newX !== position.value.x || newY !== position.value.y) {
      position.value = { x: newX, y: newY }
    }
  }

  const setupScrollListener = () => {
    scrollListener.value = () => {
      if (isOpen.value && triggerElement.value) {
        updatePosition()
        // Re-adjust position after scroll
        if (dropdownElement.value) {
          requestAnimationFrame(() => adjustPosition())
        }
      }
    }
    
    // Use capture to catch scroll events on all elements
    window.addEventListener('scroll', scrollListener.value, true)
  }

  const setPosition = (x, y) => {
    position.value = { x, y }
  }

  const open = (trigger, dropdown) => {
    if (!trigger || !dropdown) {
      console.error('[useDropdown] open() requires valid trigger and dropdown elements')
      return
    }

    close() // Clean up any existing state
    isOpen.value = true
    triggerElement.value = trigger
    dropdownElement.value = dropdown

    updatePosition()
    nextTick(() => {
      adjustPosition()
      setupScrollListener()
      
      // Setup outside click without selectors
      setTimeout(() => {
        outsideClickListener.value = (event) => {
          if (!dropdown.contains(event.target) && !trigger.contains(event.target)) {
            close()
          }
        }
        document.addEventListener('click', outsideClickListener.value)
      }, 0)
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    close()
  })

  return {
    // State
    isOpen,
    position,
    
    // Methods
    open,
    close,
    setPosition,
  }
}
