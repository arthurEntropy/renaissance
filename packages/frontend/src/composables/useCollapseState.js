import { ref } from 'vue'

/**
 * Composable for managing collapsed/expanded state of items
 * Used in components that display collapsible cards or items
 */
export function useCollapseState(defaultCollapsed = true) {
  const collapseState = ref({})

  const getCollapsedState = (item) => {
    // Default to the provided default if not set
    return collapseState.value[item.id] !== undefined
      ? collapseState.value[item.id]
      : defaultCollapsed
  }

  const setCollapsedState = (item, collapsed) => {
    collapseState.value = {
      ...collapseState.value,
      [item.id]: collapsed
    }
  }

  const toggleCollapsedState = (item) => {
    const currentState = getCollapsedState(item)
    setCollapsedState(item, !currentState)
  }

  const collapseAll = (items) => {
    const newState = {}
    items.forEach(item => {
      newState[item.id] = true
    })
    collapseState.value = { ...collapseState.value, ...newState }
  }

  const expandAll = (items) => {
    const newState = {}
    items.forEach(item => {
      newState[item.id] = false
    })
    collapseState.value = { ...collapseState.value, ...newState }
  }

  const resetCollapseState = () => {
    collapseState.value = {}
  }

  return {
    collapseState,
    getCollapsedState,
    setCollapsedState,
    toggleCollapsedState,
    collapseAll,
    expandAll,
    resetCollapseState
  }
}
