import axios from 'axios'
import { readFileSync } from 'fs'
import {
  createEngagementEmbed,
  createSkillCheckEmbed,
  createOpposedSkillCheckEmbed,
  createCustomRollEmbed,
  createSimpleRollEmbed
} from '../services/discordEmbedService.js'

let discordConfig = null

function getDiscordConfig() {
  if (discordConfig === null) {
    discordConfig = { webhookUrl: null }
    if (process.env.DISCORD_WEBHOOK_PATH) {
      try {
        discordConfig = JSON.parse(readFileSync(process.env.DISCORD_WEBHOOK_PATH, 'utf8'))
        console.log('Discord webhook configuration loaded')
      } catch (error) {
        console.error('Error loading Discord webhook config:', error.message)
      }
    } else {
      console.warn('DISCORD_WEBHOOK_PATH environment variable not set')
    }
  }
  return discordConfig
}

const sendDiscordMessage = async (req, res) => {
  const config = getDiscordConfig()
  const DISCORD_WEBHOOK_URL = config.webhookUrl
  
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook URL not configured - skipping Discord notification')
    return res.status(200).json({ message: 'Discord not configured - message not sent' })
  }

  try {
    const { characterName, opponentName, skill, type } = req.body
    let embed

    if (type === 'opposed_skill_check') {
      embed = createOpposedSkillCheckEmbed(req.body)
    } else if (type === 'injury' || type === 'initiative') {
      embed = createSimpleRollEmbed(req.body)
    } else if (characterName && opponentName) {
      embed = createEngagementEmbed(req.body)
    } else if (skill === 'Custom Roll') {
      embed = createCustomRollEmbed(req.body)
    } else {
      embed = createSkillCheckEmbed(req.body)
    }

    const payload = { embeds: [embed] }
    await axios.post(DISCORD_WEBHOOK_URL, payload)
    
    res.json({ message: 'Message sent to Discord!' })
  } catch (error) {
    console.error('Error sending to Discord:', error.message)
    res.status(500).json({ error: 'Failed to send message to Discord', details: error.message })
  }
}

export {
  sendDiscordMessage,
}
