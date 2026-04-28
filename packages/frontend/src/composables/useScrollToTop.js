import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Tracks whether an observed element (typically a filter bar) is in the
 * viewport and exposes a "scroll to top" button that appears when the user
 * scrolls back up after having scrolled the element out of view.
 *
 * @param {import('vue').Ref<HTMLElement|null>} observedRef - Element to watch
 */
export function useScrollToTop(observedRef) {
    const showToTopButton = ref(false)
    const isInView = ref(true)
    const lastScrollY = ref(0)

    let observer = null

    const updateVisibility = () => {
        const currentScrollY = window.scrollY || window.pageYOffset || 0
        const isScrollingUp = currentScrollY < lastScrollY.value
        showToTopButton.value = isScrollingUp && !isInView.value && currentScrollY > 120
        lastScrollY.value = currentScrollY
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    onMounted(() => {
        lastScrollY.value = window.scrollY || window.pageYOffset || 0

        if ('IntersectionObserver' in window && observedRef.value) {
            observer = new IntersectionObserver(([entry]) => {
                isInView.value = entry.isIntersecting
                if (entry.isIntersecting) {
                    showToTopButton.value = false
                } else {
                    updateVisibility()
                }
            }, { threshold: 0.05 })

            observer.observe(observedRef.value)
        }

        window.addEventListener('scroll', updateVisibility, { passive: true })
    })

    onUnmounted(() => {
        window.removeEventListener('scroll', updateVisibility)
        observer?.disconnect()
        observer = null
    })

    return { showToTopButton, scrollToTop }
}
