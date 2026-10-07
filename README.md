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

## API reference

### `POST /api/chat`
Send a message and get outfit recommendations.

Request body:
```json
{
  "message": "Interview next week, budget 3000 rupees",
  "chatId": "optional existing chat id",
  "image": { "data": "<base64>", "mimeType": "image/jpeg" }
}
```
Response:
```json
{
  "chatId": "66f...",
  "reply": "Here are two smart options within your budget.",
  "outfits": [
    {
      "name": "Smart Navy",
      "occasion": "Job interview",
      "items": [
        { "type": "top", "name": "White formal shirt", "color_hex": "#F5F5F5" },
        { "type": "bottom", "name": "Navy trousers", "color_hex": "#1F2A44" }
      ],
      "tip": "Keep accessories minimal."
    }
  ]
}
```

### `GET /api/chat/:id`
Returns the saved messages for a chat: `{ "messages": [...] }`.

### `DELETE /api/chat/:id`
Deletes a chat.

## Deployment (Render)

1. Push the project to GitHub (without `.env`).
2. Create a **Web Service** on [Render](https://render.com) from the repo.
3. Build command: `npm run install-all && npm run build`
4. Start command: `npm start`
5. Add environment variables `GEMINI_API_KEY`, `GEMINI_MODEL` and `MONGODB_URI` (use an Atlas connection string).
6. In Atlas, under Network Access, allow connections from Render (for a demo, `0.0.0.0/0`).

In production, Express serves the built React app, so one service runs the whole project.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing GEMINI_API_KEY or MONGODB_URI` | The file must be `server/.env`, not in the root folder |
| `MongoDB connection failed` | Atlas: whitelist your IP and URL-encode special characters in the password. Local: make sure the MongoDB service is running |
| "The stylist is unavailable" in the chat | Check the server terminal for the real error. Usually a wrong API key, an invalid model name or a quota limit |
| Blank page or failed API calls in dev | Open the app on port 5173 (not 5000) and keep both processes running |
| Port already in use | Change `PORT` in `server/.env` and update the proxy target in `client/vite.config.js` |

## Known limitations

- `gemini-3.5-flash-lite` produces text only, so outfit visuals are colour flat-lays rather than generated photos.
- Chats are identified by a browser-stored ID. There are no user accounts yet.
- Recommendations come from the model's general fashion knowledge, not a live product catalogue.

## Roadmap

- User accounts with Passport.js or JWT, and saved outfits
- Digital wardrobe: upload and tag your own clothes
- Real outfit images through an image-generation model or fashion image search API
- Streaming responses
- Rate limiting and input validation hardening
- An evaluation set to measure recommendation quality

## License

MIT
# Outfit-Pal
