import { ref } from 'vue'

const SHOW_DELAY_MS = 400
const HIDE_DELAY_MS = 120

// Module-level singleton so any card and the overlay share the same state.
const previewAbility = ref(null)
const previewEquipment = ref(null)
// Overrides the default selectedCharacter in CardPreviewOverlay — used when a
// preview is triggered from the chatlog so the card is shown in the context of
// the character that made the roll rather than the currently selected character.
const previewCharacterOverride = ref(null)
// DOMRect of the collapsed card that triggered the preview (viewport-relative).
const anchorRect = ref(null)
// Suppresses all previews while a drag is in progress.
const isDragging = ref(false)
// When true, roll-link and roll-damage events are ignored in CardPreviewOverlay.
// Set by contexts (e.g. the chatlog) that want to show info-only previews.
const previewRollsDisabled = ref(false)

let hideTimer = null
let showTimer = null

// Tracks whether SortableJS has confirmed a drag started after a mousedown.
let officialDragActive = false
let pendingMouseUpListener = null

export function useCardPreview() {
  function showAbilityPreview(ability, element, delay = SHOW_DELAY_MS, character = null, disableRolls = false) {
    if (isDragging.value) return
    clearTimeout(hideTimer)
    clearTimeout(showTimer)
    // Delay showing so a quick mousedown-drag doesn't trigger the preview.
    showTimer = setTimeout(() => {
      if (isDragging.value) return
      previewEquipment.value = null
      previewAbility.value = ability
      previewCharacterOverride.value = character
      anchorRect.value = element.getBoundingClientRect()
      previewRollsDisabled.value = disableRolls
    }, delay)
  }

  function showEquipmentPreview(equipment, element, character = null, disableRolls = false) {
    if (isDragging.value) return
    clearTimeout(hideTimer)
    clearTimeout(showTimer)
    showTimer = setTimeout(() => {
      if (isDragging.value) return
      previewAbility.value = null
      previewEquipment.value = equipment
      previewCharacterOverride.value = character
      anchorRect.value = element.getBoundingClientRect()
      previewRollsDisabled.value = disableRolls
    }, SHOW_DELAY_MS)
  }

  function scheduleHide() {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      previewAbility.value = null
      previewEquipment.value = null
      previewCharacterOverride.value = null
      anchorRect.value = null
      previewRollsDisabled.value = false
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
      previewCharacterOverride.value = null
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
    previewCharacterOverride.value = null
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
    previewCharacterOverride,
    anchorRect,
    isDragging,
    previewRollsDisabled,
    showAbilityPreview,
    showEquipmentPreview,
    scheduleHide,
    cancelHide,
    setDragging,
    startDragIntent,
  }
}
