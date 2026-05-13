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

// Tracks whether SortableJS has confirmed a drag started after a mousedown.
let officialDragActive = false
let pendingMouseUpListener = null

export function useCardPreview() {
  function showAbilityPreview(ability, element, delay = SHOW_DELAY_MS) {
    if (isDragging.value) return
    clearTimeout(hideTimer)
    clearTimeout(showTimer)
    // Delay showing so a quick mousedown-drag doesn't trigger the preview.
    showTimer = setTimeout(() => {
      if (isDragging.value) return
      previewEquipment.value = null
      previewAbility.value = ability
      anchorRect.value = element.getBoundingClientRect()
    }, delay)
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
    officialDragActive = value
    isDragging.value = value
    if (value) {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      previewAbility.value = null
      previewEquipment.value = null
      anchorRect.value = null
    } else {
      if (pendingMouseUpListener) {
        document.removeEventListener('mouseup', pendingMouseUpListener, true)
        pendingMouseUpListener = null
      }
    }
  }

  // Called on mousedown on a card. Immediately dismisses any visible preview
  // and suppresses new ones. If the mouseup arrives without a SortableJS drag
  // having started, previews are re-enabled — after expandCooldown ms when the
  // click is expanding a collapsed card, immediately otherwise.
  function startDragIntent({ expandCooldown = 0 } = {}) {
    if (pendingMouseUpListener) {
      document.removeEventListener('mouseup', pendingMouseUpListener, true)
      pendingMouseUpListener = null
    }
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    previewAbility.value = null
    previewEquipment.value = null
    anchorRect.value = null
    isDragging.value = true
    officialDragActive = false

    pendingMouseUpListener = () => {
      pendingMouseUpListener = null
      if (!officialDragActive) {
        if (expandCooldown > 0) {
          setTimeout(() => { isDragging.value = false }, expandCooldown)
        } else {
          isDragging.value = false
        }
      }
    }
    document.addEventListener('mouseup', pendingMouseUpListener, { once: true, capture: true })
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
    startDragIntent,
  }
}
