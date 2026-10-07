# Outfit Pal

A conversational AI fashion assistant. Tell it the occasion, weather, budget or style, or upload a photo of a clothing item, and it suggests complete outfits with colour palettes. It remembers the whole conversation, so recommendations get more personal as you chat.

Built with the **MERN stack** and the **Gemini API** (`gemini-3.5-flash-lite`).

## Features

- **Conversational stylist** that remembers your size, budget, style and dislikes across the chat
- **Photo input**: upload a clothing item and get outfits built around it (Gemini vision)
- **Structured outfit cards**: each outfit has named items with exact colours, a styling tip and a link to real reference photos
- **Visual flat-lays** drawn in the browser from the colour data returned by the model
- **Persistent chat history** stored in MongoDB, restored automatically on page refresh
- **Guardrails**: the assistant stays on fashion topics and asks one clarifying question when it needs more detail
- Responsive layout with light and dark mode

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, plain CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| AI | Google Gemini API (`@google/genai`), model `gemini-3.5-flash-lite` |

## How it works

1. The user sends a message (and optionally a photo) from the React app.
2. Express loads the chat from MongoDB and rebuilds the last 20 messages as conversation history.
3. The history, the new message and a system prompt are sent to Gemini with a **response schema**, so the model returns valid JSON: a short reply plus a list of outfits (items, types, hex colours, tip).
4. The server saves both turns to MongoDB and returns the result.
5. React renders the reply and draws each outfit as a colour flat-lay card.

Photos are sent to Gemini for the current turn only and are not stored. Only a note that a photo was shared is kept in history, which saves tokens and storage.

## Project structure

```
outfit-pal-mern/
├── package.json              # root scripts (install-all, dev, build, start)
├── client/                   # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js        # dev proxy: /api -> http://localhost:5000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # chat UI, photo upload, history restore
│       ├── OutfitCard.jsx    # colour flat-lay outfit card
│       └── index.css
└── server/                   # Express + MongoDB backend
    ├── server.js             # API routes and Gemini integration
    ├── models/Chat.js        # Mongoose schema
    └── .env.example
```

## Prerequisites

- Node.js 18 or higher
- A MongoDB database: [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or a local MongoDB Community Server
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Getting started

```bash
# 1. Go into the project folder
cd outfit-pal-mern

# 2. Create your environment file
cp server/.env.example server/.env        # Windows CMD: copy server\.env.example server\.env

# 3. Edit server/.env and add your keys (see below)

# 4. Install all dependencies (root, server and client)
npm run install-all

# 5. Start backend and frontend together
npm run dev
```

Open **http://localhost:5173**.

### Environment variables (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Your Gemini API key | `AIza...` |
| `GEMINI_MODEL` | Model name | `gemini-3.5-flash-lite` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/outfitpal` |
| `PORT` | API port | `5000` |

Never commit `server/.env`. It is already listed in `.gitignore`.

## Scripts

| Command | What it does |
|---|---|
| `npm run install-all` | Installs dependencies for root, server and client |
| `npm run dev` | Runs the API (port 5000) and Vite dev server (port 5173) together |
| `npm run build` | Builds the React app into `client/dist` |
| `npm start` | Starts the Express server, which also serves `client/dist` if it exists |

