import { ref, onBeforeUnmount, watch } from 'vue'

/**
 * Composable for setting up intersection observer for infinite scroll
 * @param {Function} loadFn - Function to call when intersection is detected
 * @param {Ref} hasMore - Ref indicating if there are more items to load
 * @param {Ref} disableWhen - Ref that when true, disables the observer
 * @returns {Object} - { observerRef, setup, cleanup }
 */
export function useInfiniteScrollObserver(loadFn, hasMore, disableWhen = ref(false)) {
  const observerRef = ref(null)
  let observer = null

  const cleanup = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  const setup = () => {
    // Don't setup observer if disabled
    if (disableWhen.value) {
      cleanup()
      return
    }

    if (!observerRef.value) return

    // Disconnect existing observer if any
    cleanup()

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMore.value) {
          loadFn()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    observer.observe(observerRef.value)
  }

  // Auto cleanup on unmount
  onBeforeUnmount(() => {
    cleanup()
  })

  // Watch for changes that should trigger observer reset
  watch([hasMore, disableWhen], () => {
    // Disconnect observer if disabled
    if (disableWhen.value) {
      cleanup()
      return
    }

    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      setup()
    }, 10)
  })

  return {
    observerRef,
    setup,
    cleanup,
  }
}
