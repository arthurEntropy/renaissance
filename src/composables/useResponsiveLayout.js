import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Composable for responsive layout detection
 * Returns reactive boolean for mobile/desktop state
 */
export function useResponsiveLayout() {
  const isMobile = ref(false)
  const breakpoint = 1024 // lg breakpoint in pixels

  const updateLayout = () => {
    isMobile.value = window.innerWidth < breakpoint
  }

  onMounted(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateLayout)
  })

  return {
    isMobile,
    isDesktop: computed(() => !isMobile.value)
  }
}
