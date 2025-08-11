import { computed } from 'vue'

/**
 * Composable for managing drag and drop functionality
 * Used in components that have sortable/reorderable lists
 */
export function useDragAndDrop(items, updateOrderCallback, orderProperty = 'order') {
  const sortedItems = computed({
    get() {
      // Sort by the specified order property (if exists)
      return [...items.value].sort((a, b) => {
        if (a[orderProperty] !== undefined && b[orderProperty] !== undefined) {
          return a[orderProperty] - b[orderProperty]
        }
        // If order property is not defined, maintain original order
        return 0
      })
    },
    set(newOrder) {
      // This will be called when draggable updates the order
      updateOrder(newOrder)
    },
  })

  const updateOrder = (newOrder) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) return
    
    // Call the provided callback to handle the order update
    updateOrderCallback(newOrder)
  }

  const onDragEnd = () => {
    // This will be called after a drag operation completes
    // We don't need to do anything here since the v-model binding handles the update
  }

  return {
    sortedItems,
    updateOrder,
    onDragEnd
  }
}
