import { ref, nextTick, onUnmounted } from 'vue'

/**
 * Composable for managing dropdown menus with positioning and outside click detection
 */
export function useDropdown() {
  // State
  const isOpen = ref(false)
  const position = ref({ x: 0, y: 0 })
  const outsideClickListener = ref(null)
  const scrollListener = ref(null)
  const triggerElement = ref(null)

  /**
   * Toggle dropdown visibility
   * @param {Event} event - The click event to get position from
   * @param {string} dropdownSelector - CSS selector for the dropdown element
   * @param {string} triggerSelector - CSS selector for the trigger button
   */
  const toggle = async (event, dropdownSelector, triggerSelector) => {
    const wasOpen = isOpen.value
    close() // Always close first to clean up listeners
    
    if (!wasOpen) {
      // Open the dropdown
      isOpen.value = true
      
      // Error handling for missing event
      if (!event || !event.target) {
        console.error('Toggle called without valid event object:', event)
        position.value = { x: 100, y: 100 } // Fallback position
        return
      }
      
      // Try to find the trigger element, fallback to event target
      triggerElement.value = event.target.closest(triggerSelector) || event.target
      
      // If we still don't have a good element, try to find the button
      if (!triggerElement.value.getBoundingClientRect) {
        triggerElement.value = event.target
      }
      
      // Calculate initial position
      updatePosition()

      // Wait for DOM update, then adjust position and setup listeners
      await nextTick()
      setTimeout(() => {
        adjustPosition(dropdownSelector)
        setupOutsideClick(dropdownSelector, triggerSelector)
        setupScrollListener()
      }, 10)
    }
  }

  /**
   * Update position based on current trigger element position
   */
  const updatePosition = () => {
    if (!triggerElement.value) return
    
    const triggerRect = triggerElement.value.getBoundingClientRect()
    
    // Position dropdown below the button
    position.value = {
      x: triggerRect.left,
      y: triggerRect.bottom + 5
    }
  }

  /**
   * Close the dropdown and clean up listeners
   */
  const close = () => {
    isOpen.value = false
    triggerElement.value = null
    
    if (outsideClickListener.value) {
      document.removeEventListener('click', outsideClickListener.value)
      outsideClickListener.value = null
    }
    
    if (scrollListener.value) {
      window.removeEventListener('scroll', scrollListener.value, true)
      scrollListener.value = null
    }
  }

  /**
   * Adjust dropdown position to stay within viewport
   * @param {string} dropdownSelector - CSS selector for the dropdown element
   */
  const adjustPosition = (dropdownSelector) => {
    const dropdown = document.querySelector(dropdownSelector)
    if (!dropdown) return

    const dropdownRect = dropdown.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    
    let newX = position.value.x
    let newY = position.value.y

    // Check if dropdown extends beyond bottom of viewport
    if (dropdownRect.bottom > windowHeight - 10) {
      // Position above the trigger button instead of below it
      if (triggerElement.value) {
        const triggerRect = triggerElement.value.getBoundingClientRect()
        newY = triggerRect.top - dropdownRect.height - 5
      } else {
        newY = Math.max(10, position.value.y - dropdownRect.height - 30)
      }
    }

    // Check if dropdown extends beyond right edge of viewport
    if (dropdownRect.right > windowWidth - 10) {
      newX = Math.max(10, windowWidth - dropdownRect.width - 10)
    }
    
    // Check if dropdown extends beyond left edge of viewport
    if (dropdownRect.left < 10) {
      newX = 10
    }
    
    // Update position if changed
    if (newX !== position.value.x || newY !== position.value.y) {
      position.value = { x: newX, y: newY }
    }
  }

  /**
   * Setup scroll listener to update position when page scrolls
   */
  const setupScrollListener = () => {
    scrollListener.value = () => {
      if (isOpen.value && triggerElement.value) {
        updatePosition()
      }
    }
    
    // Use capture to catch scroll events on all elements
    window.addEventListener('scroll', scrollListener.value, true)
  }

  /**
   * Setup outside click detection to close dropdown
   * @param {string} dropdownSelector - CSS selector for the dropdown element
   * @param {string} triggerSelector - CSS selector for the trigger button
   */
  const setupOutsideClick = (dropdownSelector, triggerSelector) => {
    outsideClickListener.value = (event) => {
      const dropdown = document.querySelector(dropdownSelector)
      const trigger = document.querySelector(triggerSelector)

      if (dropdown && !dropdown.contains(event.target) &&
          trigger && !trigger.contains(event.target)) {
        close()
      }
    }

    document.addEventListener('click', outsideClickListener.value)
  }

  /**
   * Set dropdown position manually
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  const setPosition = (x, y) => {
    position.value = { x, y }
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
    toggle,
    close,
    adjustPosition,
    setupOutsideClick,
    setPosition,
  }
}
