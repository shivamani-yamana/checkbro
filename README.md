# Check Bro - Real-time Chess Application

![Chess Game](./frontend/public/chess_img.jpg)

## Project Overview

Checkbro is a modern real-time chess application that allows players to compete against each other online. This project demonstrates the use of WebSocket technology for real-time game updates and a responsive user interface built with modern React.

## Features

- **Real-time gameplay** - Play chess with opponents in real-time
- **Interactive UI** - User-friendly interface with a responsive chessboard
- **Game Controls** - Features like resign, draw offer, and game restart
- **Move History** - Track game progress with a detailed move history panel
- **Player Status** - Visual indicators for player turns and game state
- **Matchmaking System** - Automatically pair with available opponents

## Technology Stack

### Frontend

- React 19 with TypeScript
- Vite as the build tool
- TailwindCSS for styling
- React Router for navigation
- react-chessboard for chess UI

### Backend

- Node.js with TypeScript
- WebSockets (ws library) for real-time communication
- chess.js for game logic and validation

## Project Structure

```
frontend/
├── src/
│   ├── components/   # UI components
│   ├── contexts/     # React context providers
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript type definitions
│   ├── Views/        # Page components
│   └── ...
└── public/           # Static assets

backend/
├── src/
│   ├── Game.ts       # Game logic
│   ├── GameManager.ts # Matchmaking and game management
│   └── ...
```

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd Chess
```

2. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Start the development servers

```bash
# Backend
cd backend
npx ts-node src/index.ts

# Frontend (in a new terminal)
cd frontend
npm run dev
```

4. Open your browser and navigate to http://localhost:5173

## Technical Details

This project was bootstrapped with React + TypeScript + Vite.

### React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
