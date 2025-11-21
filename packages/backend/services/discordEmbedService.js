import { DIE_TYPE, SPECIAL_ROLLS, EMOJI } from '../../../shared/constants/dice.js'

const COLORS = {
  SUCCESS: 0x00ff00,
  FAILURE: 0xff0000,
  DRAW: 0xffeb3b,
  NEUTRAL: 0x808080
}

const DIE_SYMBOL = {
  D12: '⭓',
  D6: '◽️'
}

export function formatDiceSymbol(dieResult) {
  try {
    const { die, roll } = dieResult
    const displayRoll = roll === 0 && dieResult.originalRoll ? dieResult.originalRoll : roll
    
    if (die === DIE_TYPE.D12) {
      if (displayRoll === SPECIAL_ROLLS.SOL) return `${DIE_SYMBOL.D12}${SPECIAL_ROLLS.SOL}${EMOJI.SOL}`
      if (displayRoll === SPECIAL_ROLLS.MORTE) return `${DIE_SYMBOL.D12}${SPECIAL_ROLLS.MORTE}${EMOJI.MORTE}`
      return `${DIE_SYMBOL.D12}${displayRoll}`
    } else if (die === DIE_TYPE.D6) {
      if (displayRoll === SPECIAL_ROLLS.SUCCESS) return `${DIE_SYMBOL.D6}${SPECIAL_ROLLS.SUCCESS}${EMOJI.SUCCESS}`
      return `${DIE_SYMBOL.D6}${displayRoll}`
    }
    return `${displayRoll}`
  } catch (error) {
    console.error('Error formatting dice symbol:', error, 'for result:', dieResult)
    return '?'
  }
}

export function createEngagementEmbed(data) {
  const { characterName, opponentName, result, userWins, opponentWins, drawCount } = data
  const winner = result === 'win' ? characterName : result === 'loss' ? opponentName : null
  const description = result === 'draw' ? 'DRAW' : `**${winner.toUpperCase()} WINS**`
  
  return {
    title: `⚔️ Engagement: ${characterName} vs ${opponentName}`,
    description,
    color: result === 'draw' ? COLORS.DRAW : (result === 'win' ? COLORS.SUCCESS : COLORS.FAILURE),
    fields: [
      {
        name: characterName,
        value: `${userWins}`,
        inline: true,
      },
      {
        name: opponentName,
        value: `${opponentWins}`,
        inline: true,
      },
      {
        name: 'Draws',
        value: `${drawCount}`,
        inline: true,
      },
    ],
  }
}

export function createSkillCheckEmbed(data) {
  const { rollResults, total, targetNumber, name: characterName, skill, success, footer, image } = data
  
  const formattedRolls = Array.isArray(rollResults)
    ? rollResults.map(result => formatDiceSymbol(result)).join(', ')
    : 'No dice were rolled'
  
  return {
    title: `${characterName || 'Someone'} rolled ${skill || 'a skill check'}`,
    description: success ? '**SUCCESS**' : '**FAILURE**',
    color: success ? COLORS.SUCCESS : COLORS.FAILURE,
    thumbnail: {
      url: image,
    },
    fields: [
      {
        name: 'Result',
        value: `${total}`,
        inline: true,
      },
      {
        name: 'Target',
        value: `${targetNumber}`,
        inline: true,
      },
      {
        name: 'Rolls',
        value: formattedRolls,
        inline: false,
      },
    ],
    footer: {
      text: footer,
    },
  }
}

export function createOpposedSkillCheckEmbed(data) {
  const { 
    characterName, 
    opponentName, 
    skillName, 
    opponentSkillName,
    userTotal, 
    opponentTotal, 
    winner 
  } = data
  
  let color = COLORS.NEUTRAL
  if (winner === 'user') {
    color = COLORS.SUCCESS
  } else if (winner === 'opponent') {
    color = COLORS.FAILURE
  }
  
  return {
    title: `${characterName} vs ${opponentName} - Opposed Skill Check`,
    description: winner === 'tie' ? '**TIE**' : `**${winner === 'user' ? characterName : opponentName} WINS**`,
    color: color,
    fields: [
      {
        name: characterName,
        value: `${skillName}: ${userTotal}`,
        inline: true,
      },
      {
        name: opponentName,
        value: `${opponentSkillName}: ${opponentTotal}`,
        inline: true,
      },
    ],
  }
}

export function createCustomRollEmbed(data) {
  const { rollResults, total, name: characterName, footer, image } = data
  
  return {
    title: `${characterName || 'Someone'} rolled custom dice`,
    color: COLORS.NEUTRAL,
    thumbnail: {
      url: image,
    },
    fields: [
      {
        name: 'Total',
        value: `${total}`,
        inline: true,
      },
      {
        name: 'Dice Results',
        value: rollResults || 'No dice were rolled',
        inline: false,
      },
    ],
    footer: {
      text: footer || '',
    },
  }
}
