export const EngagementResultTypes = {
  WIN: 'win',
  LOSS: 'loss',
  DRAW: 'draw'
}

export default EngagementResultTypes

// CommonJS compatibility for Node.js backend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EngagementResultTypes }
}
