/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} ImprovementFields
 * @property {string} name - Improvement name
 * @property {HTMLString} description - Improvement description
 * @property {number} xpCost - Experience point cost
 */

/**
 * @typedef {BaseEntity & ImprovementFields} Improvement
 */

export {}
