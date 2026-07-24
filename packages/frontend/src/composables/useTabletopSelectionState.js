import { ref } from 'vue'

// Module-level singleton – selected character IDs on the active tabletop canvas.
// Shared between useTabletopCanvas (writer) and PinnedTokensContainer (reader).
const _selectedCharacterIds = ref(new Set())

export function useTabletopSelectionState() {
    return {
        selectedCharacterIds: _selectedCharacterIds,
        setSelectedCharacterIds(ids) {
            _selectedCharacterIds.value = new Set(ids)
        },
        clearSelectedCharacterIds() {
            _selectedCharacterIds.value = new Set()
        },
    }
}
