import { TABLETOP_EVENTS } from '../../../shared/constants/tabletopSocketEvents.js'
import { getCampaignById, getCampaignMembership } from '../utils/campaignUtils.js'
import { CAMPAIGN_MEMBER_STATUS } from '../../../shared/constants/campaignConstants.js'
import { getAllDataByDirectory, saveFile } from '../utils/fileService.js'
import { socketAuthMiddleware, socketRequireApproved } from '../middleware/socketAuth.js'

const TABLETOPS_DIRECTORY = 'tabletops'
const ROLL_LOG_CAPACITY = 100

/**
 * Loads a tabletop from the file store by ID.
 * Returns null if not found.
 */
function getTabletopById(tabletopId) {
  const all = getAllDataByDirectory(TABLETOPS_DIRECTORY)
  return all.find((t) => t.id === tabletopId && !t.isDeleted) || null
}

/**
 * Sets up the Socket.IO namespace and handlers for the /tabletop room-broadcast layer.
 *
 * Responsibilities:
 *   - Let authenticated campaign members join a per-tabletop room
 *   - Relay STATE_PUSH events to all other room members
 *   - Persist ROLL_LOGGED entries (with 100-entry cap) and relay them to the room
 *
 * Intentionally NOT relayed: measurement activity (handled client-side only).
 */
export function setupTabletopSocketHandlers(io) {
  const ns = io.of('/tabletop')

  // In Socket.IO v4, middlewares registered on the root `io` instance are NOT
  // automatically inherited by named namespaces.  Apply auth here explicitly.
  ns.use(socketAuthMiddleware)
  ns.use(socketRequireApproved)

  ns.on('connection', (socket) => {
    const userId = socket.user?.uid
    console.log(`[TabletopSocket] New connection: socket=${socket.id}, userId=${userId ?? '(none)'}`)

    socket.on('disconnect', (reason) => {
      console.log(`[TabletopSocket] Disconnected: socket=${socket.id}, userId=${userId ?? '(none)'}, reason=${reason}`)
    })

    // ── Join a tabletop room ──────────────────────────────────────────────────────────────────────────
    socket.on(TABLETOP_EVENTS.JOIN, ({ tabletopId, campaignId }) => {
      console.log(`[TabletopSocket] JOIN: tabletopId=${tabletopId}, campaignId=${campaignId}, userId=${userId ?? '(none)'}`)
      if (!tabletopId || !campaignId) {
        console.warn('[TabletopSocket] JOIN rejected: missing tabletopId or campaignId')
        return socket.emit(TABLETOP_EVENTS.ERROR, { message: 'tabletopId and campaignId are required' })
      }

      // Verify campaign membership
      const campaign = getCampaignById(campaignId)
      if (!campaign) {
        console.warn(`[TabletopSocket] JOIN rejected: campaign ${campaignId} not found`)
        return socket.emit(TABLETOP_EVENTS.ERROR, { message: 'Campaign not found' })
      }
      const member = getCampaignMembership(campaign, userId)
      if (!member || member.status !== CAMPAIGN_MEMBER_STATUS.ACCEPTED) {
        console.warn(`[TabletopSocket] JOIN rejected: userId=${userId} not an accepted member (member=${JSON.stringify(member)})`)
        return socket.emit(TABLETOP_EVENTS.ERROR, { message: 'Not a campaign member' })
      }

      // Leave any previous tabletop rooms to avoid cross-tabletop leakage
      for (const room of socket.rooms) {
        if (room !== socket.id && room.startsWith('tabletop:')) {
          socket.leave(room)
        }
      }

      const roomId = `tabletop:${tabletopId}`
      socket.join(roomId)
      socket.data.tabletopId = tabletopId
      socket.data.campaignId = campaignId

      const roomSize = ns.adapter.rooms.get(roomId)?.size ?? 0
      console.log(`[TabletopSocket] JOIN success: socket=${socket.id} joined room=${roomId} (${roomSize} member(s) now)`)
      socket.emit(TABLETOP_EVENTS.JOIN_ACK, { tabletopId })
    })

    // ── Leave a tabletop room ────────────────────────────────────────────────
    socket.on(TABLETOP_EVENTS.LEAVE, () => {
      const tabletopId = socket.data.tabletopId
      if (tabletopId) {
        socket.leave(`tabletop:${tabletopId}`)
        socket.data.tabletopId = null
      }
    })

    // ── Relay tabletop state to other room members ───────────────────────────
    // The snapshot contains items, background, grid settings, radius areas, etc.
    // It does NOT contain transform (each user has their own viewport) or
    // measurement state (measurement is always local-only).
    socket.on(TABLETOP_EVENTS.STATE_PUSH, ({ tabletopId, snapshot }) => {
      if (!tabletopId || !snapshot) return
      if (socket.data.tabletopId !== tabletopId) return

      const roomId = `tabletop:${tabletopId}`
      const roomSize = ns.adapter.rooms.get(roomId)?.size ?? 0
      console.log(`[TabletopSocket] STATE_PUSH from socket=${socket.id}: relaying to ${roomSize - 1} other member(s) in room=${roomId}`)
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomId).emit(TABLETOP_EVENTS.STATE_UPDATED, { tabletopId, snapshot })
    })

    // ── Persist and relay a roll log entry ───────────────────────────────────
    // Any campaign member can log a roll; the server persists it and broadcasts it.
    socket.on(TABLETOP_EVENTS.ROLL_LOGGED, ({ tabletopId, campaignId: cid, entry }) => {
      if (!tabletopId || !entry) return
      // Basic membership guard (re-check in case socket.data wasn't set yet)
      const cIdToCheck = cid || socket.data.campaignId
      if (cIdToCheck) {
        const campaign = getCampaignById(cIdToCheck)
        const member = campaign && getCampaignMembership(campaign, userId)
        if (!member || member.status !== CAMPAIGN_MEMBER_STATUS.ACCEPTED) return
      }

      // Persist to the tabletop file
      try {
        const tabletop = getTabletopById(tabletopId)
        if (tabletop) {
          const log = Array.isArray(tabletop.rollLog) ? [...tabletop.rollLog] : []
          log.push(entry)
          if (log.length > ROLL_LOG_CAPACITY) log.shift()
          saveFile({ ...tabletop, rollLog: log }, TABLETOPS_DIRECTORY, tabletop.name, tabletop.id)
        }
      } catch (err) {
        console.error('[tabletopSocket] Failed to persist roll log entry:', err)
      }

      // Relay to room (excluding sender – the sender already updated their own log)
      const roomId = `tabletop:${tabletopId}`
      socket.to(roomId).emit(TABLETOP_EVENTS.ROLL_RECEIVED, { tabletopId, entry })
    })

    // ── Relay character stat updates to other room members ───────────────────
    // Emitted by the token info area when a player edits a character's HP or
    // defense directly on the tabletop.  The server relays it without persisting
    // (the sender already saved via REST).
    socket.on(TABLETOP_EVENTS.CHARACTER_UPDATED, ({ tabletopId, character }) => {
      if (!tabletopId || !character) return
      if (socket.data.tabletopId !== tabletopId) return

      const roomId = `tabletop:${tabletopId}`
      socket.to(roomId).emit(TABLETOP_EVENTS.CHARACTER_SYNCED, { tabletopId, character })
    })
  })
}
