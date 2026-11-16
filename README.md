# AI Scout Adventure

Kid-friendly outdoor web app: voice AI helper, nature missions, points, and levels.

## Prerequisites

- Node.js 20+ (Node 22 LTS recommended; `.nvmrc` is included)
- A [Groq API key](https://console.groq.com/keys) (`GROQ_API_KEY`, usually starts with `gsk_`)

## Setup (local development)

1. Install dependencies from the project root:

   ```bash
   npm ci
   ```

   The repo uses npm workspaces, so one root `package-lock.json` installs the root, `client/`, and `server/` dependencies together. Use `npm install` instead when you add or change dependencies.

2. Create the server environment file and add your key:

   ```bash
   cp server/.env.example server/.env
   ```

   On Windows: `copy server\.env.example server\.env`

   Edit `server/.env` and set **`GROQ_API_KEY=gsk_...`**.

3. Start the API and React dev server together:

   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173** in Chrome or Edge (best support for the Web Speech API).

To run the production build locally:

```bash
npm run build
npm start
```

Then open **http://localhost:3001**. Express serves the built client from `client/dist`.

Voice input uses **Tunisia Arabic** by default (`ar-TN` for the Web Speech API). To use another language tag, copy `client/.env.example` to `client/.env` and set `VITE_SPEECH_LANG` (e.g. `en-US`), then restart Vite.

### “Failed to fetch” / cannot reach API

- Run **`npm run dev` from the project root** (not only inside `client/`). That starts **Express on port 3001** and **Vite on 5173** together.
- Use the app at **http://localhost:5173** (the Vite URL). Do not open `index.html` as a `file://` link — API calls will fail.
- Put **`GROQ_API_KEY=...`** in **`server/.env`**. Restart `npm run dev` after editing.
- Quick check: open **http://127.0.0.1:3001/api/health** — you should see JSON with `"ok": true` and `"provider": "groq"`. If that fails, the server is not running or the port is blocked.

## Tests

```bash
npm test
```

The suite uses Node’s built-in test runner and starts the real server on a random port. It covers health, input validation, malformed JSON, JSON 404s, rate limiting, serving the built client, and the Vercel entry (`api/index.js` must import the app without opening a port). The built-client test is skipped until `npm run build` has been run once. No Groq key is required.

## Scripts

| Command | Description |
|--------|-------------|
| `npm ci` | Clean install from the root lockfile (all workspaces) |
| `npm run install:all` | Alias for `npm install` (kept for older setup notes) |
| `npm run dev` | Express on `:3001`, Vite on `:5173` |
| `npm run build` | Production build of the client |
| `npm start` | Run the API and serve `client/dist` on `:3001` |
| `npm test` | Run the integration tests |

## Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `GROQ_API_KEY` | `server/.env` | Required for the AI features |
| `GROQ_MODEL` | `server/.env` | Optional; default `qwen/qwen3.8-27b` (text and camping plan) |
| `GROQ_VISION_MODEL` | `server/.env` | Optional; default `qwen/qwen3.8-27b` (mission and identification photos) |
| `RATE_LIMIT_MAX` | `server/.env` | Optional; AI requests allowed per IP per window, default `60` |
| `RATE_LIMIT_WINDOW_MS` | `server/.env` | Optional; rate-limit window in ms, default `900000` (15 minutes) |
| `PORT` | `server/.env` | Optional locally; default `3001`. Do not set it on Vercel |

The Vite dev server proxies `/api` to the Express server. The server uses Groq’s **OpenAI-compatible** endpoint at `https://api.groq.com/openai/v1`.

`qwen/qwen3.8-27b` is a Groq preview model (multimodal: text + vision). If Groq changes model IDs, pin new ones with `GROQ_MODEL` and `GROQ_VISION_MODEL`.

## Deploy to Vercel (single project)

The app is one Vercel project with two parts:

- The Vite client is built to `client/dist` and served from Vercel’s CDN.
- The Express app in `server/index.js` is exported by `api/index.js` and runs as one Vercel Function for every `/api/*` request.

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the `AhmedGaith/Sayha` repo. Keep the **Root Directory** at the repository root (not `client/` or `server/`).
3. Vercel reads `vercel.json`, so leave the detected build settings alone. They are:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `client/dist`
4. Add **`GROQ_API_KEY`** under **Settings → Environment Variables** for Production (and Preview if you want preview AI). Optionally add `GROQ_MODEL`, `GROQ_VISION_MODEL`, `RATE_LIMIT_MAX`, and `RATE_LIMIT_WINDOW_MS`. Do **not** set `PORT`; Vercel handles the function port.
5. Deploy and open the generated domain. Check `https://<your-domain>/api/health` — it should return `{"ok":true,"provider":"groq","hasKey":true}`.

`vercel.json` sends `/api/*` to the single Express function while preserving the original path, and sends other routes to `/index.html` so SPA deep links work. `express.static()` is ignored on Vercel; the built client is served directly from `client/dist`.

Speech recognition works on Vercel’s HTTPS domain. Client and API share the same origin, so no `VITE_API_URL` is needed.

You can also deploy from the CLI after `npx vercel link`:

```bash
npx vercel --prod
```

### Mission photos on Vercel

Vercel Functions accept request bodies up to **4.5 MB** ([limit](https://vercel.com/docs/functions/limitations#request-body-size)). The app compresses photos in the browser to a JPEG with a maximum width of 1280 px before sending, which normally keeps the JSON payload well under that limit. If a photo is unusually large, take a closer/simpler photo. Groq also limits base64 image payload size (see [Groq vision docs](https://console.groq.com/docs/vision)).

### Rate limiting on Vercel

The in-memory rate limiter is per function instance, so it is best-effort rather than a shared global quota. For strict multi-instance limits, use a shared store (for example Upstash Redis) or Vercel Firewall rules.

### Mission photos

`POST /api/verify-mission` accepts JSON: `{ "missionId": "green", "missionTarget": "Find something green", "imageBase64": "<jpeg base64, no data: prefix>", "mimeType": "image/jpeg" }` and returns `{ "pass": true|false, "message": "..." }`. The app sends the selected mission target text and the uploaded photo together so the vision model checks if they match before points are awarded. The app resizes the image in the browser before sending.

### Visual identification photos

`POST /api/identify-item` accepts JSON: `{ "imageBase64": "<jpeg base64, no data: prefix>", "mimeType": "image/jpeg" }` and returns `{ "name": "...", "description": "...", "safetyLevel": "SAFE|UNKNOWN|DANGEROUS", "warning": "...", "confidence": 0-100 }`.

The model is instructed to prioritize safety, avoid certainty for wild plants and mushrooms, and always warn users not to eat unknown wild items.

## Notes

- Speech recognition needs **HTTPS** or **localhost** and works best in Chrome/Edge.
- Progress (points, missions, scout name) is stored in **localStorage** — no database.
- AI endpoints are rate-limited per IP by default (60 requests per 15 minutes). Health checks and static files are not limited.
- **Never commit `server/.env` or paste API keys in chat.** Revoke leaked keys in the Groq console and create new ones.

## Project layout

```text
ai-scout-adventure/
├── package.json          # root workspaces + dev/build/start/test scripts
├── package-lock.json     # single lockfile for all workspaces
├── .nvmrc                # Node 22
├── vercel.json           # Vercel build, API function, and SPA rewrites
├── api/
│   └── index.js          # Vercel Function entry: exports the Express app
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
├── server/               # Express + Groq (OpenAI-compatible client)
│   ├── package.json
│   ├── .env.example
│   ├── index.js
│   ├── campingPlanPrompt.js
│   └── missionVerify.js  # rules per mission id for vision checks
└── tests/                # Node test runner integration tests
```
