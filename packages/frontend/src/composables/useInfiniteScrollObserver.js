import { ref, onBeforeUnmount, watch } from 'vue'

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
    if (disableWhen.value) {
      cleanup()
      return
    }

    if (!observerRef.value) return

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

  onBeforeUnmount(() => {
    cleanup()
  })

  watch([hasMore, disableWhen], () => {
    if (disableWhen.value) {
      cleanup()
      return
    }

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
