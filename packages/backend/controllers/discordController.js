const axios = require('axios')

// Use environment variable for Discord webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

const sendDiscordMessage = (req, res) => {
  if (!DISCORD_WEBHOOK_URL) {
    return res.status(500).send('Discord webhook URL is not configured on the server.')
  }

  const {
    // Skill check fields
    rollResults,
    total,
    targetNumber,
    name,
    skill,
    success,
    footer,
    image,
    // Engagement fields
    type,
    characterName,
    opponentName,
    result,
    userWins,
    opponentWins,
    drawCount
  } = req.body

  // Detect if this is an engagement result
  const isEngagement = type === 'engagement'
  
  let embed
  
  if (isEngagement) {
    // Create engagement embed
    const winner = result === 'win' ? characterName : result === 'loss' ? opponentName : null
    const description = result === 'draw' ? 'DRAW' : `**${winner.toUpperCase()} WINS**`
    
    embed = {
      title: `⚔️ Engagement: ${characterName} vs ${opponentName}`,
      description: description,
      color: result === 'draw' ? 0xffeb3b : null, // Yellow for draw, no color for win/loss
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
  } else {
    // Create skill check embed
    embed = {
      title: `${name ? name : 'Someone'} rolled ${skill ? skill : ''}`,
      description: `${success ? '**SUCCESS**' : '**FAILURE**'}`,
      color: success ? 0x00ff00 : 0xff0000, // Green for success, red for failure
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
          value: rollResults ? rollResults.join(', ') : 'No dice were rolled.',
          inline: false,
        },
      ],
      footer: {
        text: footer,
      },
    }
  }

  axios
    .post(DISCORD_WEBHOOK_URL, { embeds: [embed] })
    .then(() => {
      res.status(200).send('Message sent to Discord!')
    })
    .catch((error) => {
      console.error(
        'Error sending message to Discord:',
        error.response ? error.response.data : error.message,
      )
      res.status(500).send(`Failed to send message. Error: ${error.message}`)
    })
}

module.exports = {
  sendDiscordMessage,
}
