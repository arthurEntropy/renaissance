/**
 * @typedef {4 | 6 | 8 | 10 | 12 | 20} DieSize - Standard polyhedral die sizes used in the game
 * 
 */

/**
 * @typedef {Object} Die
 * @property {DieSize} dieSize - Number of sides on this die
 */

/**
 * @typedef {Object} DicePool
 * @property {Die[]} dice - Array of dice in the pool
 */

/**
 * @typedef {Object} DieResult
 * @property {Die} die - Source die metadata from the original pool
 * @property {number} dieRollValue - The actual number rolled (0 if dropped)
 * @property {number} poolIndex - Position in the original dice pool (0-indexed)
 * @property {number} originalDieRollValue - Original roll value before modifications
 * @property {boolean} isDropped - Whether this die was dropped by game rules (favored/ill-favored)
 * @property {boolean} rolledMaxValue - Whether this die rolled its maximum value
 * @property {boolean} isRolling - Animation state flag
 * @property {number} displayValue - Value to display in UI (shows original if dropped)
 * @property {string|null} cssClass - CSS class for DiceFont rendering (populated by formatter)
 * @property {string|null} emoji - Emoji representation of this die roll (populated by formatter)
 */

/**
 * @typedef {Object} BaseRollResult
 * @property {string} type - Roll type identifier (from RollTypes constant)
 * @property {DieResult[]} diceResults - Array of individual die roll results
 * @property {number} total - Final total sum
 * @property {number} timestamp - When the roll occurred (Date.now())
 */

/**
 * @typedef {Object} SkillCheckRollResult
 * @property {string} type - 'skill_check'
 * @property {string} characterName - Name of character making the roll
 * @property {string} skillName - Name of skill being checked (with favored/ill-favored suffix)
 * @property {string} baseSkillName - Base skill name without modifiers
 * @property {DieResult[]} diceResults - Array of individual die roll results
 * @property {number} total - Sum of all effective die rolls
 * @property {number} difficulty - Difficulty to beat
 * @property {boolean} success - Whether the roll succeeded
 * @property {string|null} favoredStatus - 'favored', 'ill-favored', or null
 * @property {string} footer - Conditions/states text
 * @property {number} timestamp - When the roll occurred
 */

/**
 * @typedef {Object} CustomRollResult
 * @property {string} type - 'custom_roll'
 * @property {string} characterName - Name of character making the roll
 * @property {string} skillName - 'Custom Roll'
 * @property {DieResult[]} diceResults - Array of individual die roll results
 * @property {number} diceTotal - Sum of all die rolls before modifier
 * @property {number} modifier - Modifier applied to the roll
 * @property {number} total - Final total (diceTotal + modifier)
 * @property {null} difficulty - Always null for custom rolls
 * @property {null} success - Always null for custom rolls
 * @property {null} favoredStatus - Always null for custom rolls
 * @property {string} footer - Empty string for custom rolls
 * @property {number} timestamp - When the roll occurred
 */

/**
 * @typedef {Object} ContestRollResult
 * @property {string} type - 'contest'
 * @property {string} characterName - Name of current character
 * @property {string} opponentName - Name of opponent character
 * @property {string} skillName - Current character's skill name
 * @property {string} opponentSkillName - Opponent's skill name
 * @property {number} userTotal - Current character's total
 * @property {number} opponentTotal - Opponent's total
 * @property {string} winner - 'user', 'opponent', or 'tie'
 * @property {DieResult[]} userDiceResults - Current character's dice results
 * @property {DieResult[]} opponentDiceResults - Opponent's dice results
 * @property {string|null} userFavoredStatus - Current character's favored status
 * @property {string|null} opponentFavoredStatus - Opponent's favored status
 * @property {number} timestamp - When the roll occurred
 * @property {Object} session - Full session object from server
 */

/**
 * @typedef {Object} UserRollData
 * @property {string} socketId - User's socket connection ID
 * @property {Object} characterInfo - Character information
 * @property {string} characterInfo.id - Character ID
 * @property {string} characterInfo.name - Character name
 * @property {DieResult[]|number[]} rollResults - Dice results (DieResult[] for new format, number[] legacy)
 * @property {number} rollTotal - Sum of all effective die rolls
 * @property {boolean} [isAutoFail] - Whether this roll auto-failed (Twice Miserable Morte rule)
 * @property {Object} [skillCheckConfig] - Skill check configuration (contests only)
 * @property {Die[]} [selectedDice] - Selected dice (engagement only)
 * @property {string[]} [engagementSuccesses] - Engagement success IDs (engagement only)
 */

/**
 * @typedef {Object} RollSession
 * @property {string} sessionId - Unique session identifier
 * @property {string} sessionType - 'engagement' or 'contest'
 * @property {string} status - Session status (from SESSION_STATUS constant)
 * @property {UserRollData[]} users - Array of users in the session (always 2)
 * @property {number|null} winner - Winner index (0, 1, or -1 for tie) or null if not determined
 */

/**
 * @typedef {Object} RollComparison
 * @property {boolean} leftWins - Whether left side won this comparison
 * @property {boolean} rightWins - Whether right side won this comparison
 * @property {boolean} tie - Whether this comparison is a tie
 * @property {number} index - Comparison index (0-based)
 * @property {string|null} winnerCharacterId - Character ID of winner, or null for tie
 */

export {}
