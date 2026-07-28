import { io } from 'socket.io-client'
import AuthService from '../auth/authService'
import { SOCKET_CONFIG } from '@shared/constants/socketConfig.js'
import { TABLETOP_EVENTS } from '@shared/constants/tabletopSocketEvents.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Singleton socket service for the /tabletop namespace.
 *
 * Unlike the engagement session service this is not a "two-player session" but
 * a "broadcast room" identified by the tabletop ID.  Any authenticated campaign
 * member can join the room, and all events are relayed to every other member in
 * the room by the server.
 */
class TabletopSocketService {
  constructor() {
    this.socket = null
    this.currentTabletopId = null
    this.listeners = new Map()
    this._connectionInProgress = false
  }

  // ── Connection ─────────────────────────────────────────────────────────────

  async connect() {
    if (this.socket?.connected) return
    if (this._connectionInProgress) return

    this._connectionInProgress = true
    try {
      const token = await AuthService.getIdToken()
      if (!token) throw new Error('Auth token required for tabletop socket')

      this.socket = io(`${API_BASE_URL}/tabletop`, {
        reconnection: true,
        reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
        reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
        timeout: SOCKET_CONFIG.TIMEOUT,
        auth: { token },
      })

      this.socket.on('connect', () => {
        this._connectionInProgress = false
        // Re-join the tabletop room after reconnection
        if (this.currentTabletopId) {
          this._emitJoin()
        }
      })

      this.socket.on('disconnect', () => {
        this._notifyListeners('disconnect', {})
      })

      this.socket.on('connect_error', (err) => {
        this._connectionInProgress = false
        console.error('[TabletopSocket] connection error:', err)
      })

      // Relay server → listeners
      this.socket.on(TABLETOP_EVENTS.STATE_UPDATED, (data) => {
        this._notifyListeners(TABLETOP_EVENTS.STATE_UPDATED, data)
      })

      this.socket.on(TABLETOP_EVENTS.ROLL_RECEIVED, (data) => {
        this._notifyListeners(TABLETOP_EVENTS.ROLL_RECEIVED, data)
      })

      this.socket.on(TABLETOP_EVENTS.CHARACTER_SYNCED, (data) => {
        this._notifyListeners(TABLETOP_EVENTS.CHARACTER_SYNCED, data)
      })

      this.socket.on(TABLETOP_EVENTS.ACTIVE_TABLETOP_CHANGED, (data) => {
        this._notifyListeners(TABLETOP_EVENTS.ACTIVE_TABLETOP_CHANGED, data)
      })

      this.socket.on(TABLETOP_EVENTS.JOIN_ACK, (data) => {
        this._notifyListeners(TABLETOP_EVENTS.JOIN_ACK, data)
      })

      this.socket.on(TABLETOP_EVENTS.ERROR, (data) => {
        console.error('[TabletopSocket] server error:', data)
        this._notifyListeners(TABLETOP_EVENTS.ERROR, data)
      })
    } catch (err) {
      this._connectionInProgress = false
      this.socket?.disconnect()
      this.socket = null
      console.error('[TabletopSocket] failed to connect:', err)
    }
  }

  disconnect() {
    this.currentTabletopId = null
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
    this._connectionInProgress = false
    this.listeners.clear()
  }

  // ── Room management ────────────────────────────────────────────────────────

  async join(tabletopId, campaignId) {
    if (!tabletopId || !campaignId) return
    this.currentTabletopId = tabletopId
    this._pendingCampaignId = campaignId
    await this.connect()
    if (this.socket?.connected) {
      this._emitJoin()
    } else {
      console.log(`[TabletopSocket] Socket not yet connected after connect(); waiting for 'connect' event to _emitJoin`)
    }
    // If not yet connected, the 'connect' handler will call _emitJoin automatically.
  }

  leave() {
    if (this.socket?.connected && this.currentTabletopId) {
      this.socket.emit(TABLETOP_EVENTS.LEAVE)
    }
    this.currentTabletopId = null
  }

  // ── Broadcast helpers ──────────────────────────────────────────────────────

  /**
   * Broadcast a canvas state snapshot to all other viewers of this tabletop.
   * The snapshot should include items, grid settings, background, etc.
   * It intentionally excludes the user's own transform/viewport and measurement state.
   *
   * @param {string} tabletopId
   * @param {Object} snapshot
   */
  broadcastStateUpdate(tabletopId, snapshot) {
    if (!this.socket?.connected || !tabletopId) {
      console.warn(`[TabletopSocket] broadcastStateUpdate skipped: connected=${this.socket?.connected}, tabletopId=${tabletopId}`)
      return
    }
    this.socket.emit(TABLETOP_EVENTS.STATE_PUSH, { tabletopId, snapshot })
  }

  /**
   * Broadcast a roll log entry to all other viewers.
   * Also notifies the server to persist the entry.
   *
   * @param {string} tabletopId
   * @param {string} campaignId
   * @param {import('@shared/types/tabletop.js').RollLogEntry} entry
   */
  broadcastRollLogged(tabletopId, campaignId, entry) {
    if (!this.socket?.connected || !tabletopId || !entry) return
    this.socket.emit(TABLETOP_EVENTS.ROLL_LOGGED, { tabletopId, campaignId, entry })
  }

  /**
   * Broadcast a character stat update (e.g. HP or defense edited via the
   * token info area) to all other viewers of the same tabletop.
   * The server relays this without persisting — the sender already saved via REST.
   *
   * @param {string} tabletopId
   * @param {Object} character - The full updated character object
   */
  broadcastCharacterUpdate(tabletopId, character) {
    if (!this.socket?.connected || !tabletopId || !character) return
    this.socket.emit(TABLETOP_EVENTS.CHARACTER_UPDATED, { tabletopId, character })
  }

  /**
   * Announce to all campaign members (via server) that the active tabletop has changed.
   * Called by the GM after a successful REST call to set/clear the active tabletop.
   *
   * @param {string} campaignId
   * @param {string|null} activeTabletopId - The new active tabletop ID, or null to deactivate
   */
  announceActiveTabletopChanged(campaignId, activeTabletopId) {
    if (!this.socket?.connected || !campaignId) return
    this.socket.emit(TABLETOP_EVENTS.ANNOUNCE_ACTIVE_TABLETOP, { campaignId, activeTabletopId })
  }

  // ── Listener management ───────────────────────────────────────────────────

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    const cbs = this.listeners.get(event)
    if (!cbs) return
    const idx = cbs.indexOf(callback)
    if (idx !== -1) cbs.splice(idx, 1)
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _emitJoin() {
    if (!this.currentTabletopId) return
    this.socket.emit(TABLETOP_EVENTS.JOIN, {
      tabletopId: this.currentTabletopId,
      campaignId: this._pendingCampaignId,
    })
  }

  _notifyListeners(event, data) {
    const cbs = this.listeners.get(event)
    if (!cbs) return
    for (const cb of cbs) cb(data)
  }
}

// Singleton instance
const tabletopSocketService = new TabletopSocketService()
export default tabletopSocketService
