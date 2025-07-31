const axios = require('axios')
const { RollTypes } = require('../src/constants/rollTypes.js')

// TODO: Allow user to set this value per campaign and pass with the request
const DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/1339580491094822932/6_fDF8aWBxvvGTgkdN_uEsjdImLCejdXdP9BlrGVz4DG8Vg1u9kVTJl2Nf4FH0kGMlp-"

const sendDiscordMessage = (req, res) => {
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
  const isEngagement = type === RollTypes.ENGAGEMENT || (opponentName && result && userWins !== undefined)
  
  let embed
  
  if (isEngagement) {
    // Create engagement embed
    const winner = result === 'win' ? characterName : result === 'loss' ? opponentName : null
    const description = result === 'draw' ? 'DRAW' : `**${winner.toUpperCase()} WINS**`
    
    // Use provided drawCount, or calculate if not provided
    const calculatedDraws = drawCount !== undefined ? drawCount : Math.max(0, Math.max(userWins || 0, opponentWins || 0) - (userWins || 0) - (opponentWins || 0))
    
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
          value: `${calculatedDraws}`,
          inline: true,
        },
      ],
    }
  } else {
    // Create skill check embed (original logic)
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
