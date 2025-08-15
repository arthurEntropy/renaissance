import { ref, nextTick } from 'vue'

/**
 * Composable for managing dropdown menus with positioning and outside click detection
 */
export function useDropdown() {
  // State
  const isOpen = ref(false)
  const position = ref({ x: 0, y: 0 })
  const outsideClickListener = ref(null)

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
      
      // Set initial position
      position.value = {
        x: event.clientX,
        y: event.clientY + 10
      }

      // Wait for DOM update, then adjust position and setup outside click
      await nextTick()
      setTimeout(() => {
        adjustPosition(dropdownSelector)
        setupOutsideClick(dropdownSelector, triggerSelector)
      }, 10)
    }
  }

  /**
   * Close the dropdown and clean up listeners
   */
  const close = () => {
    isOpen.value = false
    if (outsideClickListener.value) {
      document.removeEventListener('click', outsideClickListener.value)
      outsideClickListener.value = null
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

    // Check if dropdown extends beyond bottom of viewport
    if (dropdownRect.bottom > windowHeight) {
      // Position above the click point instead of below it
      position.value.y = Math.max(10, position.value.y - dropdownRect.height - 30)
    }

    // Check if dropdown extends beyond right edge of viewport
    if (dropdownRect.right > windowWidth) {
      position.value.x = Math.max(10, position.value.x - (dropdownRect.right - windowWidth) - 20)
    }
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
