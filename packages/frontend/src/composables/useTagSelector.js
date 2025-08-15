import { ref, computed } from 'vue'

/**
 * Composable for managing tag selection functionality
 * Handles add/remove operations for multiple tag types (ancestries, cultures, etc.)
 */
export function useTagSelector(allItems, selectedItemIds, updateCallback) {
  const selectedId = ref('')

  const selectedItems = computed(() => {
    const ids = selectedItemIds.value || []
    return allItems.value.filter((item) => ids.includes(item.id))
  })

  const availableItems = computed(() => {
    const selectedIds = selectedItemIds.value || []
    return allItems.value.filter((item) => !selectedIds.includes(item.id))
  })

  const displayText = computed(() => {
    if (!selectedItemIds.value || !selectedItemIds.value.length) {
      return ''
    }
    return selectedItems.value.map((item) => item.name).join(', ')
  })

  const addItem = () => {
    if (!selectedId.value) return

    const currentIds = selectedItemIds.value || []
    if (!currentIds.includes(selectedId.value)) {
      const updatedIds = [...currentIds, selectedId.value]
      updateCallback(updatedIds)
    }
    selectedId.value = ''
  }

  const removeItem = (id) => {
    const currentIds = selectedItemIds.value || []
    const updatedIds = currentIds.filter((itemId) => itemId !== id)
    updateCallback(updatedIds)
  }

  return {
    selectedId,
    selectedItems,
    availableItems,
    displayText,
    addItem,
    removeItem
  }
}
