import { ref } from 'vue'

const SHOW_DELAY_MS = 400
const HIDE_DELAY_MS = 120

// Module-level singleton so any card and the overlay share the same state.
const previewAbility = ref(null)
const previewEquipment = ref(null)
// DOMRect of the collapsed card that triggered the preview (viewport-relative).
const anchorRect = ref(null)
// Suppresses all previews while a drag is in progress.
const isDragging = ref(false)

let hideTimer = null
let showTimer = null

export function useCardPreview() {
  function showAbilityPreview(ability, element) {
    if (isDragging.value) return
    clearTimeout(hideTimer)
    clearTimeout(showTimer)
    // Delay showing so a quick mousedown-drag doesn't trigger the preview.
    showTimer = setTimeout(() => {
      if (isDragging.value) return
      previewEquipment.value = null
      previewAbility.value = ability
      anchorRect.value = element.getBoundingClientRect()
    }, SHOW_DELAY_MS)
  }

  function showEquipmentPreview(equipment, element) {
    if (isDragging.value) return
    clearTimeout(hideTimer)
    clearTimeout(showTimer)
    showTimer = setTimeout(() => {
      if (isDragging.value) return
      previewAbility.value = null
      previewEquipment.value = equipment
      anchorRect.value = element.getBoundingClientRect()
    }, SHOW_DELAY_MS)
  }

  // Short delay so moving the mouse from the collapsed card into the preview
  // pane does not cause the preview to flicker out.
  function scheduleHide() {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      previewAbility.value = null
      previewEquipment.value = null
      anchorRect.value = null
    }, HIDE_DELAY_MS)
  }

  function cancelHide() {
    clearTimeout(hideTimer)
  }

  function setDragging(value) {
    isDragging.value = value
    if (value) {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      previewAbility.value = null
      previewEquipment.value = null
      anchorRect.value = null
    }
  }

  return {
    previewAbility,
    previewEquipment,
    anchorRect,
    isDragging,
    showAbilityPreview,
    showEquipmentPreview,
    scheduleHide,
    cancelHide,
    setDragging,
  }
}
