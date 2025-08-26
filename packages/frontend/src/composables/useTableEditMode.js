import { ref, computed } from 'vue'

/**
 * Composable for managing table edit mode behavior
 * Provides edit mode state and FAB (Floating Action Button) visibility logic
 * @param {Object} options - Configuration options
 * @param {Function} options.onEnterEdit - Callback when entering edit mode
 * @param {Function} options.onExitEdit - Callback when exiting edit mode
 * @param {boolean} options.showFabInEditMode - Whether FAB should show only in edit mode (default: true)
 */
export function useTableEditMode(options = {}) {
  const {
    onEnterEdit = () => {},
    onExitEdit = () => {},
    showFabInEditMode = true
  } = options

  const isEditMode = ref(false)

  const toggleEditMode = () => {
    const wasEditMode = isEditMode.value
    isEditMode.value = !isEditMode.value

    if (isEditMode.value && !wasEditMode) {
      onEnterEdit()
    } else if (!isEditMode.value && wasEditMode) {
      onExitEdit()
    }
  }

  const enterEditMode = () => {
    if (!isEditMode.value) {
      isEditMode.value = true
      onEnterEdit()
    }
  }

  const exitEditMode = () => {
    if (isEditMode.value) {
      isEditMode.value = false
      onExitEdit()
    }
  }

  const setEditMode = (value) => {
    const wasEditMode = isEditMode.value
    isEditMode.value = value

    if (isEditMode.value && !wasEditMode) {
      onEnterEdit()
    } else if (!isEditMode.value && wasEditMode) {
      onExitEdit()
    }
  }

  // FAB visibility logic
  const showAddButton = computed(() => {
    return showFabInEditMode ? isEditMode.value : true
  })

  // Helper for conditional edit controls
  const showEditControls = computed(() => isEditMode.value)

  return {
    isEditMode,
    toggleEditMode,
    enterEditMode,
    exitEditMode,
    setEditMode,
    showAddButton,
    showEditControls
  }
}
