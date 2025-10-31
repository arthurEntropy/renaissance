import { ref, computed, watch } from 'vue'

/**
 * Composable for implementing infinite scroll pagination
 * @param {Array} items - The full array of items to paginate
 * @param {Number} itemsPerPage - Number of items to load per page (default: 50)
 * @returns {Object} - Object containing paginatedItems, loadMore, reset, hasMore, currentPage
 */
export function useInfiniteScroll(items, itemsPerPage = 50) {
  const currentPage = ref(1)

  // Computed property for paginated items
  const paginatedItems = computed(() => {
    const endIndex = currentPage.value * itemsPerPage
    return items.value.slice(0, endIndex)
  })

  // Check if there are more items to load
  const hasMore = computed(() => {
    return paginatedItems.value.length < items.value.length
  })

  // Load more items
  const loadMore = () => {
    if (hasMore.value) {
      currentPage.value++
    }
  }

  // Reset pagination
  const reset = () => {
    currentPage.value = 1
  }

  // Watch for changes in the items array and reset pagination
  watch(() => items.value.length, () => {
    reset()
  })

  return {
    paginatedItems,
    loadMore,
    reset,
    hasMore,
    currentPage,
  }
}
