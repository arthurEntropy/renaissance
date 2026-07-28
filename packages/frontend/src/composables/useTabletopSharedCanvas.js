import { ref } from 'vue'

// Module-level singleton – bridges VirtualTabletopPage's canvas state with
// PinnedTokensContainer so it can read/mutate tokens without prop drilling.

const _placedCharacterIds = ref(new Set())
const _hiddenCharacterIds = ref(new Set())

// World map specific state
const _isWorldMapActive = ref(false)
const _placedCultureIds = ref(new Set())
const _cultureTokensLocked = ref(false)
let _toggleCultureLockFn = null

let _canvasItemsRef = null
let _saveStateFn = null
let _recordSnapshotFn = null

export function useTabletopSharedCanvas() {
    /**
     * Called once by VirtualTabletopPage/CampaignWorldMapPage after canvas setup to register
     * the mutable refs and persistence callbacks.
     */
    function init(canvasItemsRef, saveState, recordSnapshot, { isWorldMap = false } = {}) {
        _canvasItemsRef = canvasItemsRef
        _saveStateFn = saveState
        _recordSnapshotFn = recordSnapshot
        _isWorldMapActive.value = isWorldMap
    }

    /**
     * Called by the page whenever canvasItems changes.
     * Updates the reactive placement/visibility sets.
     */
    function syncFromCanvas(items) {
        const placed = new Set()
        const hidden = new Set()
        const placedCultures = new Set()
        for (const item of items) {
            if (item.tokenType === 'culture' && item.cultureId) {
                placedCultures.add(item.cultureId)
            } else if (item.characterId) {
                placed.add(item.characterId)
                if (item.isHidden) hidden.add(item.characterId)
            }
        }
        _placedCharacterIds.value = placed
        _hiddenCharacterIds.value = hidden
        _placedCultureIds.value = placedCultures
    }

    /**
     * Update the culture tokens locked state from the canvas.
     */
    function setCultureTokensLockedState(locked) {
        _cultureTokensLocked.value = locked
    }

    /**
     * Toggle isHidden on canvas items matching the given characterIds,
     * then persist.
     */
    function setCharactersVisibility(characterIds, isHidden) {
        if (!_canvasItemsRef) return
        _recordSnapshotFn?.()
        for (const charId of characterIds) {
            const item = _canvasItemsRef.value.find(i => i.characterId === charId)
            if (item) item.isHidden = isHidden
        }
        const newHidden = new Set(_hiddenCharacterIds.value)
        for (const charId of characterIds) {
            if (isHidden) newHidden.add(charId)
            else newHidden.delete(charId)
        }
        _hiddenCharacterIds.value = newHidden
        _saveStateFn?.()
    }

    /**
     * Remove canvas tokens whose characterId is in the provided Set and persist.
     */
    function removeTokensByCharacterIds(charIdSet) {
        if (!_canvasItemsRef) return
        _recordSnapshotFn?.()
        _canvasItemsRef.value = _canvasItemsRef.value.filter(
            i => !charIdSet.has(i.characterId)
        )
        const newPlaced = new Set(_placedCharacterIds.value)
        const newHidden = new Set(_hiddenCharacterIds.value)
        for (const charId of charIdSet) {
            newPlaced.delete(charId)
            newHidden.delete(charId)
        }
        _placedCharacterIds.value = newPlaced
        _hiddenCharacterIds.value = newHidden
        _saveStateFn?.()
    }

    /**
     * Toggle the culture tokens locked state from PinnedTokensContainer.
     * Delegates to a callback registered by CampaignWorldMapPage.
     */
    function registerToggleCultureLock(fn) {
        _toggleCultureLockFn = fn
    }

    function toggleCultureLock() {
        _toggleCultureLockFn?.()
    }

    return {
        placedCharacterIds: _placedCharacterIds,
        hiddenCharacterIds: _hiddenCharacterIds,
        isWorldMapActive: _isWorldMapActive,
        placedCultureIds: _placedCultureIds,
        cultureTokensLocked: _cultureTokensLocked,
        init,
        syncFromCanvas,
        setCultureTokensLockedState,
        setCharactersVisibility,
        removeTokensByCharacterIds,
        registerToggleCultureLock,
        toggleCultureLock,
    }
}
