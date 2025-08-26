# Renaissance

IN WHICH YOU WILL FIND, behind a great deal of scaffolding and dusty tarps, a Vue.js application for the Renaissance TTRPG: a plane that I'm building as I'm flying it.

This project is equal parts coding practice and dumping ground for the unending cavalcade of game ideas and imagined places that enter unbidden into my brain at all hours and without heed for what I ought to be thinking about at the time.

Let me be unequivocal: this game is a sort of head cheese of parts both invented and - crucially - borrowed, and thus is not at all intended for publishing. Though I have trafficked in and continue to traffic in more Millenial side hustles than can possibly be adviseable, this is not one of them. I'm just here to have fun. And anyway, if you're reading this, you probably know me. Or, if you're a potential employer, you should definitely hire me because I'm fun to work with and I get stuff done.

## Features

- **Character Management:** Complete character sheets with skills, abilities, ancestry, culture, and equipment
- **Real-time Multiplayer Combat:** Live engagement sessions with WebSocket-powered dice rolling and result tracking
- **Advanced Dice System:** Custom dice font integration with animated rolling mechanics supporting d4, d6, d8, d10, d12, and d20
- **Equipment System:** Comprehensive equipment management with engagement dice, successes, and wielding mechanics
- **Rich Text Editing:** Integrated TipTap editor for game design buildout by admin and some character fields for users
- **Data Management:** JSON-based data storage for characters, abilities, ancestries, cultures, equipment, and world elements
- **Discord Integration:** Automated webhook notifications for skill checks and engagement results with rich embeds showing dice rolls, outcomes, and character information

## Tech Stack

- **Frontend:** Vue 3, Vite, Pinia, Vue Router
- **Backend:** Express.js, Socket.IO for real-time multiplayer
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
│   ├── src/
│   │   ├── components/   # Vue components (character sheets, modals, dice displays)
│   │   ├── pages/        # Vue pages (character selection, equipment, etc.)
│   │   ├── stores/       # Pinia state management
│   │   ├── services/     # API services and business logic
│   │   ├── composables/  # Vue composition functions (dice rolling, engagement)
│   │   ├── constants/    # Game constants and enums
│   │   └── assets/       # Static assets including custom dice font
│   ├── public/           # Static assets
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Frontend dependencies
├── backend/           # Express.js backend API
│   ├── controllers/      # Route handlers
│   ├── utils/           # Backend utilities
│   ├── server.js        # Express server with Socket.IO
│   └── package.json     # Backend dependencies
shared/                # Shared utilities and constants
├── constants/            # Shared constants between frontend/backend
├── types/               # Type definitions
└── utils/               # Utility functions (dice font, string helpers)
data/                  # JSON data files for the Renaissance RPG system
├── abilities/           # Character abilities and traits
├── ancestries/          # Character ancestries
├── characters/          # Saved character data
├── cultures/            # Character cultures and backgrounds
├── equipment/           # Weapons, armor, and gear
├── engagementSuccesses/ # Combat success conditions
├── mestieri/            # Character professions/classes
├── rules/               # Game rules and mechanics
├── users/               # User accounts and preferences
└── worldElements/       # World-building content
docs/                  # Documentation (if any)
```

## Environment Variables

Create a `.env` file in the project root for backend configuration:

```
# Backend Configuration
PORT=3000
DISCORD_WEBHOOK_URL=

# Frontend Configuration (for Vite dev server)
VITE_API_URL=http://localhost:3000
```

### Variable Descriptions

- **PORT:** Backend server port (default: 3000)
- **DISCORD_WEBHOOK_URL:** Optional Discord webhook for sending game notifications
- **VITE_API_URL:** Frontend API endpoint URL, used by services and Vite dev proxy

## Contributing

This project uses:

- **ESLint** for code linting and formatting
- **Prettier** for consistent code style
- **Yarn workspaces** for monorepo management

Run `yarn lint` to check code quality before committing changes.

## Repository

- **Main branch:** `maestro` (default)
- **License:** Private repository
- **Version:** 0.1.0 (Active Development)
