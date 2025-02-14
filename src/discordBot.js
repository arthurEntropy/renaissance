const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');
const express = require('express');
const axios = require('axios');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Your bot token from the Discord Developer Portal
const token = 'MTMzOTU3NjkwMDA5NTQ0NzA2Mw.GBg5Bh.LTUXfc8H-Som4kF_ib5mWDV7XovSAm1ea-5PQA';

// Set up Express server
const app = express();
app.use(express.json());

// When a dice roll is triggered from your app, this endpoint will receive it
app.post('/send-message', async (req, res) => {
  const { message } = req.body;

  // Create a new embed for the dice roll message
  const embed = new MessageEmbed()
    .setColor('#FFDD00')
    .setTitle('Dice Roll Result')
    .setDescription(message)
    .setTimestamp()
    .setFooter('Renaissance TTRPG');

  try {
    // Get the channel where the message should be sent (replace with your channel ID)
    const channel = await client.channels.fetch('YOUR_CHANNEL_ID_HERE');
    await channel.send({ embeds: [embed] });
    res.status(200).send('Message sent to Discord!');
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending message');
  }
});

// Log in to Discord with your app's token
client.login(token);

// O