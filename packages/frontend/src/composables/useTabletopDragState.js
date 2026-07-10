import { ref } from 'vue'

// Module-level singleton – shared across the app so PinnedTokensContainer and
// VirtualTabletopPage can exchange the dragged character snapshot without
// relying on dataTransfer.getData, which is unavailable during dragover.
const _draggingCharacter = ref(null)

export function useTabletopDragState() {
    return {
        draggingCharacter: _draggingCharacter,
        setDraggingCharacter(snapshot) {
            _draggingCharacter.value = snapshot
        },
        clearDraggingCharacter() {
            _draggingCharacter.value = null
        },
    }
}
