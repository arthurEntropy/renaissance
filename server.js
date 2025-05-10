require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getAllEntities, createEntity, updateEntity, deleteEntity } = require('./controllers/entityController.js');
const { sendDiscordMessage } = require('./controllers/discordController.js');
const { getEntityNames } = require('./utils/fileService.js');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Dynamically retrieve entity names from the "data" directory
const entities = getEntityNames();
console.log('Available entities:', entities);

// Entity routes
entities.forEach((entity) => {
  app.get(`/${entity}`, getAllEntities(entity));
  app.post(`/${entity}`, createEntity(entity));
  app.put(`/${entity}/:id`, updateEntity(entity));
  app.delete(`/${entity}/:id`, deleteEntity(entity));
});

// Make sure rules is registered as an entity
if (!entities.includes('rules')) {
  console.log('Adding rules entity manually...');
  app.get('/rules', getAllEntities('rules'));
  app.post('/rules', createEntity('rules'));
  app.put('/rules/:id', updateEntity('rules'));
  app.delete('/rules/:id', deleteEntity('rules'));
}

// Discord route
app.post('/send-message', sendDiscordMessage);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});