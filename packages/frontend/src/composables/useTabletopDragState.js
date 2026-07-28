import { ref } from 'vue'

// Module-level singleton – shared across the app so PinnedTokensContainer and
// VirtualTabletopPage can exchange the dragged character snapshot without
// relying on dataTransfer.getData, which is unavailable during dragover.
const _draggingCharacter = ref(null)

// Group drag: array of character snapshots for the unplaced members of a dragged group.
// Set by PinnedTokensContainer when a group-level drag starts; read by useTabletopCanvas
// to show multiple ghost tokens during dragover.
const _draggingGroup = ref(null)

// Culture drag (world map only): snapshot of the dragged culture token.
const _draggingCulture = ref(null)

export function useTabletopDragState() {
    return {
        draggingCharacter: _draggingCharacter,
        setDraggingCharacter(snapshot) {
            _draggingCharacter.value = snapshot
        },
        clearDraggingCharacter() {
            _draggingCharacter.value = null
        },
        draggingGroup: _draggingGroup,
        setDraggingGroup(snapshots) {
            _draggingGroup.value = snapshots
        },
        clearDraggingGroup() {
            _draggingGroup.value = null
        },
        draggingCulture: _draggingCulture,
        setDraggingCulture(snapshot) {
            _draggingCulture.value = snapshot
        },
        clearDraggingCulture() {
            _draggingCulture.value = null
        },
    }
}
