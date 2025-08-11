# renaissance

## Project setup

```
yarn install
```

### Run dev server (Vite)

```
yarn dev
```

### Build for production

```
yarn build
```

### Preview production build locally

```
yarn preview
```

### Lint

```
yarn lint
```

### Environment variables

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
