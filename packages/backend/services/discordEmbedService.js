import { DIE_TYPE, SPECIAL_ROLLS, EMOJI } from '../../../shared/constants/dice.js'
import { WINNER } from '../../../shared/constants/winner.js'

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
    const { dieRollValue } = dieResult
    const dieSize = dieResult.die.dieSize
    const displayDieRollValue = dieRollValue === 0 && dieResult.originalDieRollValue ? dieResult.originalDieRollValue : dieRollValue
    
    if (dieSize === DIE_TYPE.D12) {
      if (displayDieRollValue === SPECIAL_ROLLS.SOL) return `${DIE_SYMBOL.D12}${SPECIAL_ROLLS.SOL}${EMOJI.SOL}`
      if (displayDieRollValue === SPECIAL_ROLLS.MORTE) return `${DIE_SYMBOL.D12}${SPECIAL_ROLLS.MORTE}${EMOJI.MORTE}`
      return `${DIE_SYMBOL.D12}${displayDieRollValue}`
    } else if (dieSize === DIE_TYPE.D6) {
      if (displayDieRollValue === SPECIAL_ROLLS.SUCCESS) return `${DIE_SYMBOL.D6}${SPECIAL_ROLLS.SUCCESS}${EMOJI.SUCCESS}`
      return `${DIE_SYMBOL.D6}${displayDieRollValue}`
    }
    return `${displayDieRollValue}`
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
    color: COLORS.NEUTRAL,
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
  const { rollResults, total, difficulty, name: characterName, skill, success, footer, image } = data
  
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
        name: 'Difficulty',
        value: `${difficulty}`,
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

export function createContestEmbed(data) {
  const { 
    characterName, 
    opponentName, 
    skillName, 
    opponentSkillName,
    userTotal, 
    opponentTotal, 
    winner 
  } = data
  
  return {
    title: `🤼‍♂️ Contest: ${characterName} vs ${opponentName}`,
    description: winner === WINNER.TIE ? '**TIE**' : `**${winner === WINNER.USER ? characterName : opponentName} WINS**`,
    color: COLORS.NEUTRAL,
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

export function createSimpleRollEmbed(data) {
  const { rollResults, total, name: characterName, skill, footer, image } = data

  const formattedRolls = Array.isArray(rollResults)
    ? rollResults.map(result => formatDiceSymbol(result)).join(', ')
    : rollResults || 'No dice were rolled'

  return {
    title: `${characterName || 'Someone'} rolled ${skill || 'dice'}`,
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
        name: 'Rolls',
        value: formattedRolls,
        inline: false,
      },
    ],
    footer: {
      text: footer || '',
    },
  }
}
