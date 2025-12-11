import { ref, computed, watch } from 'vue'

export function useInfiniteScroll(items, itemsPerPage = 50) {
  const currentPage = ref(1)

  const paginatedItems = computed(() => {
    const endIndex = currentPage.value * itemsPerPage
    return items.value.slice(0, endIndex)
  })

  const hasMore = computed(() => {
    return paginatedItems.value.length < items.value.length
  })

  const loadMore = () => {
    if (hasMore.value) {
      currentPage.value++
    }
  }

  const reset = () => {
    currentPage.value = 1
  }

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
