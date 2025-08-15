export const SessionStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active', 
  ROLLING: 'rolling',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export default SessionStatus

// CommonJS compatibility for Node.js backend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SessionStatus }
}
