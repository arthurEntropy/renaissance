import axios from 'axios'

const COLORS = {
  SUCCESS: 0x00ff00, // Green
  FAILURE: 0xff0000, // Red
  DRAW: 0xffeb3b // Yellow
}

const createEngagementEmbed = (data) => {
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

const createSkillCheckEmbed = (data) => {
  const { rollResults, total, targetNumber, name: characterName, skill, success, footer, image } = data
  
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
        value: rollResults ? rollResults.join(', ') : 'No dice were rolled',
        inline: false,
      },
    ],
    footer: {
      text: footer,
    },
  }
}

const sendDiscordMessage = async (req, res) => {
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
  
  if (!DISCORD_WEBHOOK_URL) {
    return res.status(500).json({ error: 'Discord webhook URL not configured' })
  }

  try {
    const { characterName, opponentName, result, userWins, opponentWins, drawCount } = req.body

    if (characterName && opponentName) {
      const embed = createEngagementEmbed(req.body)
      const payload = { embeds: [embed] }
      await axios.post(DISCORD_WEBHOOK_URL, payload)
      res.json({ message: 'Engagement sent to Discord!' })
    } else {
      const embed = createSkillCheckEmbed(req.body)
      const payload = { embeds: [embed] }
      await axios.post(DISCORD_WEBHOOK_URL, payload)
      res.json({ message: 'Message sent to Discord!' })
    }
  } catch (error) {
    console.error('Error sending to Discord:', error.message)
    res.status(500).json({ error: 'Failed to send message to Discord', details: error.message })
  }
}

export {
  sendDiscordMessage,
}
