export const RollTypes = {
  ENGAGEMENT: 'engagement',
  SKILL_CHECK: 'skill_check'
}

export default RollTypes

// CommonJS compatibility for Node.js backend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RollTypes }
}
