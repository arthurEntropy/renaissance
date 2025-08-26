# Renaissance

A Vue.js application for managing tabletop RPG content, featuring character sheets, equipment management, and real-time engagement tracking.

## Tech Stack

- **Frontend:** Vue 3, Vite, Pinia, Vue Router
- **Backend:** Express.js, Socket.IO
- **Rich Text:** TipTap editor with custom dice font integration
- **Styling:** CSS custom properties with design tokens

## Requirements

- Node.js 18+
- Yarn package manager

## Project Setup

```
yarn install
```

## Development

### Start both frontend and backend (recommended)

```
yarn dev
```

### Start individually

```
# Backend only
yarn dev:backend

# Frontend only
yarn dev:frontend
```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend at `http://localhost:3000`.

## Production

### Build for production

```
yarn build
```

### Preview production build locally

```
yarn preview
```

## Code Quality

### Lint and fix code

```
yarn lint
```

## Project Structure

```
packages/
├── frontend/          # Vue.js frontend application
│   ├── src/              # Vue components, pages, stores
│   ├── public/           # Static assets
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Frontend dependencies
├── backend/           # Express.js backend API
│   ├── controllers/      # Route handlers
│   ├── utils/           # Backend utilities
│   ├── server.js        # Express server
│   └── package.json     # Backend dependencies
shared/                # Shared utilities (dicefont, strings)
data/                  # JSON data files
```

## Environment Variables

Create a `.env` file in the project root for the backend and Vite dev proxy:

```
# Backend
PORT=3000
DISCORD_WEBHOOK_URL=

# Frontend (Vite)
VITE_API_URL=http://localhost:3000
```

- VITE_API_URL is used by the frontend services and Vite dev proxy to reach the Express API.
- DISCORD_WEBHOOK_URL configures the Discord webhook used by the `/send-discord-message` endpoint.
