require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(express.json());
app.use(cors());

const charactersDir = path.join(process.cwd(), 'data', 'characters');

const getAllCharacters = () => {
    return fs.readdirSync(charactersDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
            const filePath = path.join(charactersDir, file);

            try {
                const data = fs.readFileSync(filePath, 'utf8');
                if (!data.trim()) {
                    console.warn(`Skipping empty file: ${file}`);
                    return null;
                }

                return JSON.parse(data);
            } catch (error) {
                console.error(`Error parsing ${file}: ${error.message}`);
                return null;
            }
        })
        .filter(character => character !== null); // Remove null entries
};

const saveCharacter = (characterData, filePath) => {
    const tempFilePath = `${filePath}.tmp`;

    try {
        // Validate JSON before writing
        JSON.parse(JSON.stringify(characterData));

        fs.writeFileSync(tempFilePath, JSON.stringify(characterData, null, 2), 'utf8');
        fs.renameSync(tempFilePath, filePath); // Atomic rename
    } catch (error) {
        console.error(`Error saving character file: ${path.basename(filePath)}`, error);
    }
};

const sanitizeFilename = (name) => {
    return name.trim().toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')  // Replace special characters with underscores
        .replace(/_+/g, '_'); // Remove multiple consecutive underscores
};

app.get('/characters', (req, res) => {
    fs.readdir(charactersDir, (err, files) => {
      if (err) {
        console.error("Error reading characters directory:", err);
        return res.status(500).send("Error reading characters directory.");
      }
  
      const characters = files.map(file => {
        const filePath = path.join(charactersDir, file);
        return JSON.parse(fs.readFileSync(filePath));
      });
  
      res.json(characters);
    });
});
  
app.put('/characters/:id', (req, res) => {
    const characterId = parseInt(req.params.id);
    const updatedCharacter = req.body;

    let characters = getAllCharacters();
    let existingCharacter = characters.find(c => c.id === characterId);

    try {
        if (existingCharacter) {
            // Determine old and new filenames
            const oldFilename = sanitizeFilename(existingCharacter.name) + ".json";
            const newFilename = sanitizeFilename(updatedCharacter.name) + ".json";
            const oldFilePath = path.join(charactersDir, oldFilename);
            const newFilePath = path.join(charactersDir, newFilename);

            // Rename file if name has changed
            if (existingCharacter.name !== updatedCharacter.name) {
                fs.renameSync(oldFilePath, newFilePath);
                console.log(`Renamed ${oldFilename} to ${newFilename}`);
            }

            // Save updated character data
            saveCharacter(updatedCharacter, newFilePath);
            console.log(`Successfully updated ${newFilename}`);
            res.status(200).send("Character updated successfully.");
        } else {
            // Create a new character with an incremented ID
            const newId = characters.length > 0 ? Math.max(...characters.map(c => c.id)) + 1 : 1;
            updatedCharacter.id = newId;
            const newFilename = sanitizeFilename(updatedCharacter.name) + ".json";
            const newFilePath = path.join(charactersDir, newFilename);

            saveCharacter(updatedCharacter, newFilePath);
            console.log(`Successfully created new character: ${newFilename}`);
            res.status(201).send({ message: "Character created successfully.", id: newId });
        }
    } catch (error) {
        console.error("Error handling character data:", error);
        res.status(500).send("Failed to process character data.");
    }
});


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
