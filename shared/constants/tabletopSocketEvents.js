/**
 * Socket.IO event names for the /tabletop namespace.
 * Used by both the frontend service and the backend controller.
 */
export const TABLETOP_EVENTS = {
  // Client → Server
  JOIN:               'tabletop:join',               // Join a tabletop room
  LEAVE:              'tabletop:leave',              // Leave a tabletop room
  STATE_PUSH:         'tabletop:state-push',         // Push a state snapshot (token positions, grid, etc.)
  ROLL_LOGGED:        'tabletop:roll-logged',        // A character on the canvas made a roll
  CHARACTER_UPDATED:  'tabletop:character-updated',  // A character's stats were edited (HP, defense, etc.)
  ANNOUNCE_ACTIVE_TABLETOP: 'tabletop:announce-active', // GM announces a new active tabletop for all campaign members

  // Server → Clients (broadcast to room, minus sender)
  STATE_UPDATED:      'tabletop:state-updated',      // Another user's state push
  ROLL_RECEIVED:      'tabletop:roll-received',      // Another user's roll event
  CHARACTER_SYNCED:   'tabletop:character-synced',   // Relay of another user's character stat edit
  ACTIVE_TABLETOP_CHANGED: 'tabletop:active-tabletop-changed', // GM changed the active tabletop (campaign-wide)
  // Server → single client
  JOIN_ACK:           'tabletop:join-ack',           // Acknowledgement that join succeeded
  ERROR:              'tabletop:error',              // Error from server
}

export default TABLETOP_EVENTS
