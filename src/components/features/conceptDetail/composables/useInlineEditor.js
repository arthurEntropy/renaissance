import { ref, nextTick } from 'vue'

/**
 * Composable for inline editing functionality
 * @param {Function} getValue - Function that returns the current value
 * @param {Function} setValue - Function to set the new value
 * @param {Function} onSave - Optional callback when saving
 */
export function useInlineEditor(getValue, setValue, onSave) {
  const isEditing = ref(false)
  const backupValue = ref(null)

  const startEdit = () => {
    isEditing.value = true
    backupValue.value = getValue()
  }

  const saveEdit = () => {
    isEditing.value = false
    if (onSave) {
      onSave()
    }
  }

  const cancelEdit = () => {
    setValue(backupValue.value)
    isEditing.value = false
  }

  const focusElement = async (elementRef) => {
    await nextTick()
    if (elementRef.value) {
      elementRef.value.focus()
      if (elementRef.value.select) {
        elementRef.value.select()
      }
    }
  }

  return {
    isEditing,
    startEdit,
    saveEdit,
    cancelEdit,
    focusElement
  }
}
