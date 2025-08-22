import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable for managing item selector/dropdown functionality
 * Used in components that have searchable item selectors with source grouping
 * @param {Ref} allItems - Reactive array of all items to search through
 * @param {Object} sources - Sources object for grouping
 * @param {Object} getSourceUtils - Utilities for source management
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.searchFields - Fields to search in (default: ['name', 'description'])
 */
export function useItemSelector(allItems, sources, getSourceUtils, options = {}) {
  // Configuration
  const searchFields = options.searchFields || ['name', 'description']
  // State
  const showSelector = ref(false)
  const searchQuery = ref('')
  const filteredItems = ref([])

  // Methods
  const toggleSelector = (event) => {
    if (event) {
      event.stopPropagation() // Prevent immediate closing
    }
    showSelector.value = !showSelector.value

    if (showSelector.value) {
      searchQuery.value = ''
      filteredItems.value = []
    }
  }

  const closeSelector = () => {
    showSelector.value = false
  }

  const openSelector = () => {
    showSelector.value = true
    searchQuery.value = ''
    filteredItems.value = []
  }

  const filterItems = () => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) {
      filteredItems.value = []
      return
    }

    filteredItems.value = (allItems.value || []).filter((item) => {
      return searchFields.some(field => {
        const fieldValue = item[field]
        return fieldValue && fieldValue.toLowerCase().includes(query)
      })
    })
  }

  // Grouped items computed property
  const groupedItems = computed(() => {
    const grouped = {
      general: [], // For items without a source or with an unknown source
    }

    // Add custom group if any items have isCustom property
    const hasCustomItems = (allItems.value || []).some(item => item.isCustom)
    if (hasCustomItems) {
      grouped.custom = []
    }

    const items = filteredItems.value.length > 0 ? filteredItems.value : allItems.value || []

    // Group items
    items
      .filter((item) => !item.isDeleted)
      .forEach((item) => {
        if (item.isCustom === true) {
          // Custom items go to the custom group
          grouped.custom.push(item)
        } else if (!item.source || !getSourceUtils.getSourceById(item.source)) {
          // Items without a source or with an unrecognized source go to the general group
          grouped.general.push(item)
        } else {
          // All other items are grouped by their source
          const sourceId = item.source
          if (!grouped[sourceId]) {
            grouped[sourceId] = []
          }
          grouped[sourceId].push(item)
        }
      })

    // Sort items within each group by name
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name))
    })

    // Return a new ordered object to control the display order
    const orderedGrouped = {}

    // 1. General items first (if any exist)
    if (grouped.general.length > 0) {
      orderedGrouped.general = grouped.general
    }

    // 2. Add all other source groups (sorted alphabetically by source name)
    const sourceKeys = Object.keys(grouped)
      .filter((key) => key !== 'custom' && key !== 'general')
      .sort((a, b) => {
        const sourceNameA = getSourceUtils.getSourceName(a)
        const sourceNameB = getSourceUtils.getSourceName(b)
        return sourceNameA.localeCompare(sourceNameB)
      })

    sourceKeys.forEach((key) => {
      orderedGrouped[key] = grouped[key]
    })

    // 3. Custom items last (if any exist)
    if (grouped.custom && grouped.custom.length > 0) {
      orderedGrouped.custom = grouped.custom
    }

    return orderedGrouped
  })

  // Outside click handling
  const handleOutsideClick = (event) => {
    const selector = document.querySelector('.ability-selector-container, .equipment-selector-container')
    
    if (
      showSelector.value &&
      selector &&
      !selector.contains(event.target)
    ) {
      showSelector.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    document.addEventListener('click', handleOutsideClick)
  })

  onBeforeUnmount(() => {
    showSelector.value = false
    document.removeEventListener('click', handleOutsideClick)
  })

  return {
    // State
    showSelector,
    searchQuery,
    filteredItems,
    
    // Computed
    groupedItems,
    
    // Methods
    toggleSelector,
    closeSelector,
    openSelector,
    filterItems
  }
}
