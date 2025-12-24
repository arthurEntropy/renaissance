import { ref, computed, onUnmounted } from 'vue'

export function useFloatingElement(options = {}) {
  const {
    delay = 0,
    gap = 5,
    offset = { x: 0, y: 0 },
    adjustToViewport = true,
    viewportPadding = 10,
    closeOnOutsideClick = false,
    closeOnScroll = false
  } = options

  // State
  const isVisible = ref(false)
  const content = ref(null)
  const position = ref({ x: 0, y: 0 })
  const triggerElement = ref(null)
  const floatingElement = ref(null)
  const delayTimer = ref(null)
  const outsideClickListener = ref(null)
  const scrollListener = ref(null)

  const calculatePosition = (triggerRect) => {
    return {
      x: triggerRect.left + triggerRect.width / 2 + offset.x,
      y: triggerRect.bottom + gap + offset.y
    }
  }

  const adjustPosition = (floatingRect, triggerRect) => {
    if (!adjustToViewport) return position.value

    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    let { x, y } = position.value

    if (floatingRect.bottom > windowHeight - viewportPadding) {
      y = triggerRect.top - floatingRect.height - gap + offset.y
      if (y < viewportPadding) {
        y = viewportPadding
      }
    }

    const halfWidth = floatingRect.width / 2
    if (x - halfWidth < viewportPadding) {
      x = viewportPadding + halfWidth
    } else if (x + halfWidth > windowWidth - viewportPadding) {
      x = windowWidth - viewportPadding - halfWidth
    }

    return { x, y }
  }

  const show = (contentData, triggerSource, floatingEl = null) => {
    // Clear any existing timer
    if (delayTimer.value) {
      clearTimeout(delayTimer.value)
    }

    // Get trigger element from event or direct element
    const trigger = triggerSource?.target || triggerSource
    if (!trigger) return

    triggerElement.value = trigger
    floatingElement.value = floatingEl

    // Calculate initial position
    const triggerRect = trigger.getBoundingClientRect()
    position.value = calculatePosition(triggerRect)

    // Show content after delay
    const showContent = () => {
      content.value = contentData
      isVisible.value = true

      // Adjust position after render if floating element is provided
      if (floatingEl && adjustToViewport) {
        setTimeout(() => {
          const floatingRect = floatingEl.getBoundingClientRect()
          position.value = adjustPosition(floatingRect, triggerRect)
        }, 0)
      }

      // Set up outside click listener
      if (closeOnOutsideClick) {
        setTimeout(() => {
          outsideClickListener.value = (event) => {
            if (floatingEl && !floatingEl.contains(event.target) && !trigger.contains(event.target)) {
              hide()
            }
          }
          document.addEventListener('click', outsideClickListener.value)
        }, 0)
      }

      // Set up scroll listener
      if (closeOnScroll) {
        scrollListener.value = () => hide()
        window.addEventListener('scroll', scrollListener.value, true)
      }
    }

    if (delay > 0) {
      delayTimer.value = setTimeout(showContent, delay)
    } else {
      showContent()
    }
  }

  const hide = () => {
    if (delayTimer.value) {
      clearTimeout(delayTimer.value)
      delayTimer.value = null
    }

    isVisible.value = false
    content.value = null
    triggerElement.value = null
    floatingElement.value = null

    if (outsideClickListener.value) {
      document.removeEventListener('click', outsideClickListener.value)
      outsideClickListener.value = null
    }

    if (scrollListener.value) {
      window.removeEventListener('scroll', scrollListener.value, true)
      scrollListener.value = null
    }
  }

  const style = computed(() => ({
    top: `${position.value.y}px`,
    left: `${position.value.x}px`
  }))

  onUnmounted(() => {
    hide()
  })

  return {
    isVisible,
    content,
    position,
    style,
    show,
    hide
  }
}

export function useTooltip(options = {}) {
  return useFloatingElement({
    delay: 750,
    gap: 5,
    adjustToViewport: true,
    closeOnOutsideClick: false,
    closeOnScroll: false,
    ...options
  })
}
