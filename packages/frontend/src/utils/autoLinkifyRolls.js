/**
 * Auto-linkify roll patterns in HTML content
 * Wraps recognized patterns with <a data-roll-action="..."> links
 * Operates on text nodes only, preserving existing HTML structure
 */

import { CORE_ABILITIES } from '@shared/constants/characterConstants'

/**
 * @typedef {{ key: string, label: string }} CoreAbility
 * @typedef {{ type: 'stat', value: CoreAbility } | { type: 'number', value: number }} RollModifier
 * @typedef {{
 *   type?: 'opposed-skill-check' | 'skill-check-multiple' | 'skill-check' | 'damage-roll' | 'custom-roll',
 *   skill?: string,
 *   opponentSkill?: string,
 *   skills?: string[],
 *   skillsText?: string,
 *   dice?: Array<{ count: number, sides: number }>,
 *   modifier: RollModifier | null,
 *   fullText: string,
 *   linkText: string,
 *   rollPrefix?: string,
 *   biomeDiceMod?: number,
 * }} RollData
 */

const SKILLS = [
  'Awe', 'Strength', 'Dexterity', 'Fortitude', 'Craft',
  'Perform', 'Insight', 'Courtesy', 'Spirit', 'Aid',
  'Persuade', 'Awareness', 'Stealth', 'Lore', 'Riddle'
]

const CORE_ABILITIES_LIST = Object.values(CORE_ABILITIES)

// Build combined regex pattern for all roll types (only once)
const SKILLS_PATTERN = SKILLS.join('|')
const CORE_ABILITIES_PATTERN = CORE_ABILITIES_LIST.map((ability) => ability.label).join('|')

// Combined pattern matches all roll types in priority order
const ROLL_PATTERN = new RegExp(
  // Pattern 1: "Roll <Skill> vs <Skill>" (opposed check) - highest priority
  `[Rr]oll\\s+(${SKILLS_PATTERN})\\s+vs\\.?\\s+(${SKILLS_PATTERN})` +
  '|' +
  // Pattern 2: "Roll <Skill>, <Skill>, ... and/or <Skill>" (multiple skill options)
  // Handles: "Roll Awe, Spirit, or Persuade" or "Roll Insight and Courtesy"
  `[Rr]oll\\s+((?:${SKILLS_PATTERN})(?:\\s*,\\s*(?:${SKILLS_PATTERN}))*(?:\\s*,)?\\s+(?:and|or)\\s+(?:${SKILLS_PATTERN}))` +
  '|' +
  // Pattern 3: "Roll <Skill>" (simple skill check)
  `[Rr]oll\\s+(${SKILLS_PATTERN})` +
  '|' +
  // Pattern 4: "<diceExpr> damage" (damage roll)
  `(\\d+d\\d+(?:\\s*\\+\\s*(?:${CORE_ABILITIES_PATTERN}|\\d+))?)\\s+[Dd]amage` +
  '|' +
  // Pattern 5: "<diceExpr>" alone (custom roll)
  `(\\d+d\\d+(?:\\s*\\+\\s*(?:${CORE_ABILITIES_PATTERN}|\\d+))?)`,
  'g'
)

/**
 * Parse dice expression and create roll data from regex match
 * @param {RegExpMatchArray} match
 */
function parseRollMatch(match) {
  const fullMatch = match[0]
  
  // Opposed skill check: Roll <Skill> vs <Skill>
  if (match[1] && match[2]) {
    const rollPrefix = fullMatch.match(/^[Rr]oll\s+/)?.[0] ?? ''
    return {
      type: 'opposed-skill-check',
      skill: match[1],
      opponentSkill: match[2],
      fullText: fullMatch,
      linkText: `${match[1]} vs ${match[2]}`,
      rollPrefix
    }
  }
  
  // Multiple skill options: Roll <Skill>, <Skill>, ... and/or <Skill>
  if (match[3]) {
    const skillsText = match[3]
    const rollPrefix = fullMatch.match(/^[Rr]oll\s+/)?.[0] ?? ''
    // Extract individual skill names from the comma/conjunction-separated list
    const skillPattern = new RegExp(SKILLS_PATTERN, 'g')
    const skills = []
    let skillMatch
    while ((skillMatch = skillPattern.exec(skillsText)) !== null) {
      skills.push(skillMatch[0])
    }
    
    return {
      type: 'skill-check-multiple',
      skills: skills,
      fullText: fullMatch,
      skillsText: skillsText,
      rollPrefix
    }
  }
  
  // Simple skill check: Roll <Skill>
  if (match[4]) {
    const rollPrefix = fullMatch.match(/^[Rr]oll\s+/)?.[0] ?? ''
    return {
      type: 'skill-check',
      skill: match[4],
      fullText: fullMatch,
      linkText: match[4],
      rollPrefix
    }
  }
  
  // Parse dice expression for damage or custom rolls
  const diceExpr = match[5] || match[6]
  if (diceExpr) {
    const diceMatch = diceExpr.match(/(\d+)d(\d+)(?:\s*\+\s*([A-Z]+|\d+))?/i)
    if (!diceMatch) return null
    
    const count = parseInt(diceMatch[1], 10)
    const sides = parseInt(diceMatch[2], 10)
    const modPart = diceMatch[3]
    
    /** @type {RollData} */
    const rollData = {
      dice: [{ count, sides }],
      modifier: null,
      fullText: fullMatch,
      linkText: fullMatch
    }
    
    if (modPart) {
      const upperMod = modPart.toUpperCase()
      const coreAbility = CORE_ABILITIES_LIST.find((ability) => ability.label === upperMod)
      if (coreAbility) {
        rollData.modifier = { type: 'stat', value: coreAbility }
      } else {
        const numMod = parseInt(modPart, 10)
        if (!isNaN(numMod)) {
          rollData.modifier = { type: 'number', value: numMod }
        }
      }
    }
    
    // Damage roll (has " damage" suffix)
    if (match[5]) {
      rollData.type = 'damage-roll'
    } else {
      // Custom roll
      rollData.type = 'custom-roll'
    }
    
    return rollData
  }
  
  return null
}

/**
 * Process a text node and replace roll patterns with links
 * Uses a single regex pass for O(n) complexity
 * @param {Text} textNode
 */
function processTextNode(textNode) {
  const text = textNode.nodeValue
  if (!text || !text.trim()) return
  
  const fragments = []
  let lastIndex = 0
  
  // Reset regex state
  ROLL_PATTERN.lastIndex = 0
  
  // Find all matches in one pass
  let match
  while ((match = ROLL_PATTERN.exec(text)) !== null) {
    const rollData = parseRollMatch(match)
    if (!rollData) continue
    
    // Add text before the match
    if (match.index > lastIndex) {
      fragments.push(document.createTextNode(text.substring(lastIndex, match.index)))
    }
    
    // Handle multiple skill options specially
    if (rollData.type === 'skill-check-multiple') {
      // Add "Roll " prefix
      fragments.push(document.createTextNode(rollData.rollPrefix ?? ''))
      
      // Parse the skills text to create links interspersed with punctuation
      const skillsText = rollData.skillsText ?? ''
      let skillsLastIndex = 0
      const skillPattern = new RegExp(SKILLS_PATTERN, 'g')
      let skillMatch
      
      while ((skillMatch = skillPattern.exec(skillsText)) !== null) {
        // Add text before skill (commas, "and", "or", spaces)
        if (skillMatch.index > skillsLastIndex) {
          fragments.push(document.createTextNode(skillsText.substring(skillsLastIndex, skillMatch.index)))
        }
        
        // Create link for this skill
        const link = document.createElement('a')
        link.href = '#'
        link.className = 'roll-link'
        link.dataset.rollAction = JSON.stringify({
          type: 'skill-check',
          skill: skillMatch[0],
          fullText: `Roll ${skillMatch[0]}`,
          linkText: skillMatch[0]
        })
        link.textContent = skillMatch[0]
        fragments.push(link)
        
        skillsLastIndex = skillMatch.index + skillMatch[0].length
      }
      
      // Add any remaining text after last skill
      if (skillsLastIndex < skillsText.length) {
        fragments.push(document.createTextNode(skillsText.substring(skillsLastIndex)))
      }
    } else {
      // For other roll types, split "Roll " prefix from the linkable part
      if (rollData.rollPrefix) {
        fragments.push(document.createTextNode(rollData.rollPrefix))
      }
      
      // Create link for the rollable part
      const link = document.createElement('a')
      link.href = '#'
      link.className = 'roll-link'
      link.dataset.rollAction = JSON.stringify(rollData)
      link.textContent = rollData.linkText ?? ''
      fragments.push(link)
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    fragments.push(document.createTextNode(text.substring(lastIndex)))
  }
  
  // Replace text node with fragments if we found any matches
  if (fragments.length > 1) {
    const parent = textNode.parentNode
    if (!parent) return
    fragments.forEach(fragment => parent.insertBefore(fragment, textNode))
    parent.removeChild(textNode)
  }
}

/**
 * Walk DOM tree and linkify text nodes
 * @param {HTMLElement | DocumentFragment} element
 */
function linkifyTextNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip text inside existing links or scripts
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (parent.tagName === 'A' || parent.tagName === 'SCRIPT') {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )
  
  /** @type {Text[]} */
  const textNodes = []
  let node
  while ((node = walker.nextNode())) {
    textNodes.push(/** @type {Text} */ (node))
  }
  
  // Process in reverse to avoid walker invalidation
  for (let i = textNodes.length - 1; i >= 0; i--) {
    processTextNode(textNodes[i])
  }
}

/**
 * Main function: auto-linkify roll patterns in sanitized HTML
 * @param {string} html
 */
export function autoLinkifyRolls(html) {
  if (!html || typeof html !== 'string') return html
  
  // Parse HTML into DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Process all text nodes
  linkifyTextNodes(doc.body)
  
  // Return serialized HTML
  return doc.body.innerHTML
}
