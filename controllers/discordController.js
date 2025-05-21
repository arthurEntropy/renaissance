const axios = require('axios')

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

const sendDiscordMessage = (req, res) => {
  console.log('Received roll request:', req.body)
  const {
    rollResults,
    total,
    targetNumber,
    name,
    skill,
    success,
    footer,
    image,
  } = req.body

  if (success === undefined || success === null) {
    console.error('Success value is missing.')
    return res.status(400).send('Missing success value.')
  }

  const embed = {
    title: `${name ? name : 'Someone'} rolled ${skill ? skill : ''}`,
    description: `${success ? '**SUCCESS**' : '**FAILURE**'}`,
    color: success ? 0x00ff00 : 0xff0000,
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

  console.log('Embed Object:', JSON.stringify(embed, null, 2))

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
