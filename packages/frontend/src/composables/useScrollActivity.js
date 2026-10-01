import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Tracks recent scroll activity on the window, exposing a ref that becomes
 * true while scrolling and reverts to false after `idleDelay` ms of inactivity.
 *
 * @param {number} idleDelay - ms of scroll inactivity before reporting idle
 */
export function useScrollActivity(idleDelay = 1000) {
    const isScrolling = ref(false)
    let idleTimer = null

    const onScroll = () => {
        isScrolling.value = true
        clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
            isScrolling.value = false
        }, idleDelay)
    }

    onMounted(() => {
        window.addEventListener('scroll', onScroll, { passive: true })
    })

    onUnmounted(() => {
        window.removeEventListener('scroll', onScroll)
        clearTimeout(idleTimer)
    })

    return { isScrolling }
}
