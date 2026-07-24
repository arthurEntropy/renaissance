import { onMounted, onUnmounted, watch } from 'vue'
import tabletopSocketService from '@/services/sessions/tabletopSocketService'
import { TABLETOP_EVENTS } from '@shared/constants/tabletopSocketEvents.js'
import { useCharactersStore } from '@/stores/charactersStore'

/**
 * Bridges `useTabletopCanvas` with the tabletop socket service so that canvas
 * state changes are broadcast to other viewers in real-time, and external
 * state updates are applied to the local canvas.
 *
 * Measurement activity is intentionally NOT synced – it is purely local state
 * and is never included in the canvas snapshots this composable handles.
 *
 * @param {Object} opts
 * @param {import('vue').ComputedRef<string|null>} opts.tabletopId
 * @param {import('vue').ComputedRef<string|null>} opts.campaignId
 * @param {Function} opts.applyExternalState - `(snapshot) => void` from useTabletopCanvas
 */
export function useTabletopSync({ tabletopId, campaignId, applyExternalState, onActiveTabletopChanged }) {
  const charactersStore = useCharactersStore()

  // ── Socket event handlers ────────────────────────────────────────────────

  function _onStateUpdated({ tabletopId: remoteTid, snapshot }) {
    console.log(`[TabletopSync] STATE_UPDATED received: remoteTid=${remoteTid}, myTid=${tabletopId.value}`)
    // Only apply updates meant for the currently-open tabletop
    if (remoteTid !== tabletopId.value) {
      console.log('[TabletopSync] STATE_UPDATED ignored (different tabletop)')
      return
    }
    console.log('[TabletopSync] Applying external state')
    applyExternalState(snapshot)
  }

  function _onCharacterSynced({ character }) {
    if (!character?.id) return
    charactersStore.updateFromSocket(character)
  }

  function _onActiveTabletopChanged(data) {
    onActiveTabletopChanged?.(data)
  }

  tabletopSocketService.on(TABLETOP_EVENTS.STATE_UPDATED, _onStateUpdated)
  tabletopSocketService.on(TABLETOP_EVENTS.CHARACTER_SYNCED, _onCharacterSynced)
  tabletopSocketService.on(TABLETOP_EVENTS.ACTIVE_TABLETOP_CHANGED, _onActiveTabletopChanged)

  // ── Join / leave lifecycle ───────────────────────────────────────────────

  async function _joinRoom() {
    const tid = tabletopId.value
    const cid = campaignId.value
    console.log(`[TabletopSync] _joinRoom called: tid=${tid}, cid=${cid}`)
    if (tid && cid) {
      await tabletopSocketService.join(tid, cid)
    }
  }

  function _leaveRoom() {
    tabletopSocketService.leave()
  }

  // Watch for tabletop ID changes (Vue Router reuses the component without
  // unmounting it when switching between tabletops of the same campaign).
  watch(tabletopId, (newId, oldId) => {
    if (!newId || newId === oldId) return
    _leaveRoom()
    _joinRoom()
  })

  // campaignId is often undefined on first mount because campaign data loads
  // asynchronously after auth resolves.  Retry the join whenever it first
  // becomes available (or changes, e.g. if the user switches campaigns).
  watch(campaignId, (newCid) => {
    if (!newCid) return
    _joinRoom()
  })

  onMounted(() => {
    _joinRoom()
  })

  onUnmounted(() => {
    tabletopSocketService.off(TABLETOP_EVENTS.STATE_UPDATED, _onStateUpdated)
    tabletopSocketService.off(TABLETOP_EVENTS.CHARACTER_SYNCED, _onCharacterSynced)
    tabletopSocketService.off(TABLETOP_EVENTS.ACTIVE_TABLETOP_CHANGED, _onActiveTabletopChanged)
    _leaveRoom()
  })

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Call this after a canvas state save to broadcast the snapshot to other
   * viewers.  The snapshot should NOT include the transform (each user has
   * their own viewport) or any measurement state.
   *
   * @param {Object} snapshot
   */
  function broadcastStateUpdate(snapshot) {
    const tid = tabletopId.value
    if (!tid) return
    tabletopSocketService.broadcastStateUpdate(tid, snapshot)
  }

  /**
   * Broadcast a character stat change (HP, defense, etc.) to other viewers of
   * this tabletop.  Call this after the REST save has completed.
   *
   * @param {Object} character - The full updated character object
   */
  function broadcastCharacterUpdate(character) {
    const tid = tabletopId.value
    if (!tid || !character) return
    tabletopSocketService.broadcastCharacterUpdate(tid, character)
  }

  /**
   * Announce to all campaign members that the GM has changed the active tabletop.
   * Call this after the REST call to setActiveTabletop has succeeded.
   *
   * @param {string} campaignId
   * @param {string|null} activeTabletopId
   */
  function announceActiveTabletopChanged(cid, activeTabletopId) {
    tabletopSocketService.announceActiveTabletopChanged(cid, activeTabletopId)
  }

  return { broadcastStateUpdate, broadcastCharacterUpdate, announceActiveTabletopChanged }
}
