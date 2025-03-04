require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(express.json());
app.use(cors());

app.post('/send-message', (req, res) => {
    console.log("Received roll request:", req.body);  // <-- Log request payload
    
    const { rollResults, total, targetNumber, name, skill, success, footer } = req.body;
  
    if (success === undefined || success === null) {
        console.error("Success value is missing.");
        return res.status(400).send("Missing success value.");
    }
  
    console.log(`Roll Results: ${rollResults}, Total: ${total}, Target: ${targetNumber}, Success: ${success}`);
  
    const embed = {
        title: `${name ? name : 'Someone'} rolled ${skill ? skill : ''}`,
        description: `${success ? '**SUCCESS**' : '**FAILURE**'}`,
        color: success ? 0x00FF00 : 0xFF0000,
        thumbnail: {
            url: 'https://cdn.midjourney.com/3914bd33-13a2-48e4-89c5-b75076572688/0_1.png',
        },
        fields: [
            {
                name: "Result",
                value: `${total}`,
                inline: true
            },
            {
                name: "Target",
                value: `${targetNumber}`,
                inline: true
            },
            {
                name: "Rolls",
                value: rollResults ? rollResults.join(', ') : "No dice were rolled.",
                inline: false
            }
        ],
        footer: {
            text: footer,
        }
    };
    
    console.log("Embed Object:", JSON.stringify(embed, null, 2)); // Log the embed
    
    axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] })
        .then(() => {
            res.status(200).send("Message sent to Discord!");
        })
        .catch((error) => {
            console.error("Error sending message to Discord:", error.response ? error.response.data : error.message);
            res.status(500).send(`Failed to send message. Error: ${error.message}`);
        });
    });    

  
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
});
