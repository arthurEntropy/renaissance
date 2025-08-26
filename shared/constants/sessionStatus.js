export const SESSION_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active', 
  ROLLING: 'rolling',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export default SESSION_STATUS

// CommonJS compatibility for Node.js backend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SESSION_STATUS }
}
