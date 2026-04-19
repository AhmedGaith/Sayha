# AI Scout Adventure

Kid-friendly outdoor web app: voice AI helper, nature missions, points, and levels.

## Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com/keys) (`GROQ_API_KEY`, usually starts with `gsk_`)

## Setup

1. Install dependencies (from project root):

   ```bash
   npm run install:all
   ```

2. Copy environment files and add your key:

   ```bash
   copy server\.env.example server\.env
   ```

   Edit `server/.env` and set **`GROQ_API_KEY=gsk_...`**.

3. Start the app (runs API + React dev server):

   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173** in Chrome or Edge (best support for Web Speech API).

Voice input uses **Tunisia Arabic** by default (`ar-TN` for the Web Speech API). To use another language tag, copy `client/.env.example` to `client/.env` and set `VITE_SPEECH_LANG` (e.g. `en-US`), then restart Vite.

### “Failed to fetch” / cannot reach API

- Run **`npm run dev` from the `ai-scout-adventure` project root** (not only inside `client/`). That starts **Express on port 3001** and **Vite on 5173** together.
- Use the app at **http://localhost:5173** (the Vite URL). Do not open `index.html` as a `file://` link — API calls will fail.
- Put **`GROQ_API_KEY=...`** in **`server/.env`**. Restart `npm run dev` after editing.
- Quick check: open **http://127.0.0.1:3001/api/health** — you should see JSON with `"ok": true` and `"provider": "groq"`. If that fails, the server is not running or the port is blocked.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run install:all` | Install root, client, and server deps |
| `npm run dev` | Express on `:3001`, Vite on `:5173` |
| `npm run build` | Production build of the client |

## Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `GROQ_API_KEY` | `server/.env` | Required for `/api/ask-ai` and mission photo checks |
| `GROQ_MODEL` | `server/.env` | Optional; default `llama-3.3-70b-versatile` (text) |
| `GROQ_VISION_MODEL` | `server/.env` | Optional; default `meta-llama/llama-4-scout-17b-16e-instruct` (vision / JSON) |
| `PORT` | `server/.env` | Optional, default `3001` |

The Vite dev server proxies `/api` to the Express server. The server uses Groq’s **OpenAI-compatible** endpoint at `https://api.groq.com/openai/v1`.

### Mission photos

`POST /api/verify-mission` accepts JSON: `{ "missionId": "green", "missionTarget": "Find something green", "imageBase64": "<jpeg base64, no data: prefix>", "mimeType": "image/jpeg" }` and returns `{ "pass": true|false, "message": "..." }`. The app sends the selected mission target text and the uploaded photo together so the vision model checks if they match before points are awarded. The app resizes the image in the browser before sending. Groq limits base64 image payload size (see [Groq vision docs](https://console.groq.com/docs/vision)); the client compresses images to help stay under limits.

### Visual identification photos

`POST /api/identify-item` accepts JSON: `{ "imageBase64": "<jpeg base64, no data: prefix>", "mimeType": "image/jpeg" }` and returns `{ "name": "...", "description": "...", "safetyLevel": "SAFE|UNKNOWN|DANGEROUS", "warning": "...", "confidence": 0-100 }`.

The model is instructed to prioritize safety, avoid certainty for wild plants and mushrooms, and always warn users not to eat unknown wild items.

## Notes

- Speech recognition needs **HTTPS** or **localhost** and works best in Chrome/Edge.
- Progress (points, missions, scout name) is stored in **localStorage** — no database.
- For a static production deploy, point the client at your API (e.g. configure a full URL in `fetch` or put the API behind the same domain as the site).
- **Never commit `server/.env` or paste API keys in chat.** Revoke leaked keys in the Groq console and create new ones.

## Project layout

```text
ai-scout-adventure/
├── package.json          # root: concurrently runs client + server
├── README.md
├── client/               # Vite + React + Tailwind
│   ├── package.json
│   ├── .env.example      # optional VITE_SPEECH_LANG (default ar-TN)
│   ├── vite.config.js    # proxies /api → localhost:3001
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/GameContext.jsx
│       ├── utils/
│       └── components/
└── server/               # Express + Groq (OpenAI-compatible client)
    ├── package.json
    ├── .env.example
    ├── index.js
    └── missionVerify.js   # rules per mission id for vision checks
```
