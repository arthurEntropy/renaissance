import { ref, watch, toRef } from 'vue'

/**
 * Composable for managing individual card collapse state with parent synchronization
 * Standardizes collapse behavior across card components
 */
export function useCardCollapseState(props, emit) {
  // Create reactive reference to props.collapsed
  const propsCollapsed = toRef(props, 'collapsed')
  
  // Internal collapse state initialized from props
  const localCollapsed = ref(propsCollapsed.value)

  /**
   * Watch for prop changes and sync local state
   */
  watch(propsCollapsed, (newVal) => {
    localCollapsed.value = newVal
  })

  /**
   * Watch local state changes and emit to parent
   */
  watch(localCollapsed, (newVal) => {
    emit('update:collapsed', newVal)
  })

  /**
   * Toggle the collapsed state
   */
  const toggleCollapsed = () => {
    localCollapsed.value = !localCollapsed.value
  }

  /**
   * Set collapsed state directly
   * @param {boolean} collapsed - The new collapsed state
   */
  const setCollapsed = (collapsed) => {
    localCollapsed.value = collapsed
  }

  /**
   * Handler for BaseCard collapse events
   * @param {boolean} newVal - The new collapsed state from BaseCard
   */
  const onBaseCardCollapsed = (newVal) => {
    localCollapsed.value = newVal
    emit('update:collapsed', newVal)
  }

  return {
    localCollapsed,
    toggleCollapsed,
    setCollapsed,
    onBaseCardCollapsed
  }
}
