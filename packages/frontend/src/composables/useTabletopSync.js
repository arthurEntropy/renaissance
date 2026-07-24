import { onMounted, onUnmounted, watch } from 'vue'
import tabletopSocketService from '@/services/sessions/tabletopSocketService'
import { TABLETOP_EVENTS } from '@shared/constants/tabletopSocketEvents.js'

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
export function useTabletopSync({ tabletopId, campaignId, applyExternalState }) {
  // ── Socket event handlers ────────────────────────────────────────────────

  function _onStateUpdated({ tabletopId: remoteTid, snapshot }) {
    // Only apply updates meant for the currently-open tabletop
    if (remoteTid !== tabletopId.value) return
    applyExternalState(snapshot)
  }

  tabletopSocketService.on(TABLETOP_EVENTS.STATE_UPDATED, _onStateUpdated)

  // ── Join / leave lifecycle ───────────────────────────────────────────────

  async function _joinRoom() {
    const tid = tabletopId.value
    const cid = campaignId.value
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

  onMounted(() => {
    _joinRoom()
  })

  onUnmounted(() => {
    tabletopSocketService.off(TABLETOP_EVENTS.STATE_UPDATED, _onStateUpdated)
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

  return { broadcastStateUpdate }
}
