export const SESSION_EVENTS = {
  // Connection events (Socket.IO built-ins)
  CONNECT: 'connect',                           // Socket connected to server
  DISCONNECT: 'disconnect',                     // Socket disconnected from server
  CONNECT_ERROR: 'connect_error',               // Connection attempt failed
  ERROR: 'error',                               // General socket error
  
  // Session lifecycle events (emit & broadcast use same name)
  SESSION_CREATED: 'session-created',           // Server: new session created for first user
  SESSION_UPDATED: 'session-updated',           // Server: session state changed (user joined, rolls submitted, etc.)
  SESSION_CANCELLED: 'session-cancelled',       // Server: session was cancelled by a user
  SESSION_EXPIRED: 'session-expired',           // Server→Clients: session expired due to inactivity
  USER_LEFT: 'user-left',                       // Server: a user left the session
  
  // Roll events (different semantic meanings)
  SUBMIT_ROLL_RESULTS: 'submit-roll-results',   // Client→Server: submit my roll results
  SESSION_COMPLETED: 'session-completed',       // Server→Clients: session complete with final results and winner
  
  // Result management events (emit & broadcast use same name)
  RESULT_INDICATOR_UPDATED: 'result-indicator-updated',  // Engagement: die comparison result toggled
  
  // Acceptance events (emit & broadcast use same name)
  ACCEPTANCE_STATE_UPDATED: 'acceptance-state-updated',  // User accepted/rejected session results
  
  // Die reroll events (different semantic meanings)
  REROLL_DIE: 'reroll-die',                     // Client→Server: request to reroll a specific die
  DIE_REROLLED: 'die-rerolled',                 // Server→Clients: die was rerolled (for animations)
  
  // Session actions (client→server only)
  CANCEL_SESSION: 'cancel-session',             // Client→Server: cancel current session
  COMPLETE_SESSION: 'complete-session',         // Client→Server: mark session complete with winner
  AUTO_JOIN_OR_CREATE: 'auto-join-or-create',   // Client→Server: join existing session or create new one
  
  // Engagement-specific events (emit & broadcast use same name)
  SUCCESS_ASSIGNMENT_UPDATED: 'success-assignment-updated',  // Engagement success assigned to die
}

export default SESSION_EVENTS
