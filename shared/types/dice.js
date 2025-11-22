/**
 * @typedef {4 | 6 | 8 | 10 | 12 | 20} DieSides
 * Number of sides on a die
 */

/**
 * @typedef {Object} Die
 * @property {DieSides} dieSides - Number of sides on this die
 * @property {string} [cssClass] - CSS class for rendering
 * @property {boolean} [isAdded] - Whether this die was added (e.g., from a condition)
 * @property {boolean} [isSubtracted] - Whether this die was subtracted (e.g., from a condition)
 */

/**
 * @typedef {Object} SingleDieRollResult
 * @property {DieSides} dieSides - Number of sides on this die
 * @property {number} dieRollValue - The actual number rolled on this die
 * @property {number} [originalDieRollValue] - Original roll value before any modifications
 * @property {number} effectiveDieRollValue - 0 if dropped, otherwise equals dieRollValue
 * @property {number} displayDieRollValue - Value to display in UI (original if dropped)
 * @property {boolean} rolledMaxValue - Whether this die rolled its maximum value
 * @property {boolean} isDropped - Whether this die was dropped by game rules
 * @property {number} poolIndex - Position in the original dice pool (0-indexed)
 * @property {string} [cssClass] - CSS class for rendering
 * @property {string} [emoji] - Emoji representation of this die roll
 */

/**
 * @typedef {Object} DicePool
 * @property {Die[]} dice - Array of dice in the pool
 */

/**
 * @typedef {Object} RollResult
 * @property {SingleDieRollResult[]} rollResults - Array of individual die roll results
 * @property {number} rollTotal - Sum of all effective die rolls
 * @property {number} [diceTotal] - Sum before modifier (custom rolls only)
 * @property {number} [modifier] - Modifier applied to the roll (custom rolls only)
 */

/**
 * @typedef {Object} SkillCheckRollResult
 * @property {SingleDieRollResult[]} rollResults - Array of individual die roll results
 * @property {number} rollTotal - Sum of all effective die rolls
 * @property {any} characterInfo - Character information (outside refactoring scope)
 * @property {any} skillCheckConfig - Skill check configuration (outside refactoring scope)
 * @property {boolean} [isAutoFail] - Whether this roll automatically failed
 */

/**
 * @typedef {Object} CustomRollResult
 * @property {SingleDieRollResult[]} rollResults - Array of individual die roll results
 * @property {number} diceTotal - Sum of all die rolls before modifier
 * @property {number} modifier - Modifier applied to the roll
 * @property {number} rollTotal - Final total (diceTotal + modifier)
 * @property {any} characterInfo - Character information (outside refactoring scope)
 */

/**
 * @typedef {Object} OpposedSkillCheckRollResult
 * @property {UserRollData} user1 - First user's roll data
 * @property {UserRollData} user2 - Second user's roll data
 * @property {string} winner - 'user1', 'user2', or 'tie'
 * @property {RollComparison[]} comparisons - Detailed comparison of matched dice
 */

/**
 * @typedef {Object} UserRollData
 * @property {SingleDieRollResult[]} rollResults - Array of individual die roll results
 * @property {number} rollTotal - Sum of all effective die rolls
 * @property {any} characterInfo - Character information (outside refactoring scope)
 * @property {any} skillCheckConfig - Skill check configuration (outside refactoring scope)
 */

/**
 * @typedef {Object} RollSession
 * @property {UserRollData} user1 - First user's roll data
 * @property {UserRollData} user2 - Second user's roll data
 * @property {RollComparison[]} comparisons - Detailed comparison of matched dice
 */

/**
 * @typedef {Object} RollComparison
 * @property {SingleDieRollResult} user1Die - First user's die
 * @property {SingleDieRollResult} user2Die - Second user's die
 * @property {string} winner - 'user1', 'user2', or 'tie'
 */

export {}
