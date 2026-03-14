# Arese.AI — Student Intelligence Platform

A single-file AI-powered web app built for students. Includes 9 tools powered by **Ollama Cloud** (DeepSeek v3.2), served via a Node.js + Express backend. Includes Google OAuth login, daily message limits, and a Pro plan.

---

## Features

| Tool | Description |
|---|---|
| 📅 Study Planner | Generates a personalized 7-day timetable |
| ✍️ Essay & Grammar Helper | Fixes grammar, vocabulary, and structure |
| 🔍 Fake News Detector | Scores credibility with full reasoning |
| 🧘 Mental Wellness Chat | Stress and burnout support chatbot |
| 📝 Note Summarizer | Summaries, key points, and flashcards |
| 🌐 Language Tutor | Practice any language with corrections |
| 💻 Coding Assistant | Debug, explain, improve, and guide |
| ✦ General AI Chat | Ask anything — with skill selector + web search |
| 🎙 Voice Mode | Speak in English or Hindi, hear replies |

---

## Pricing

| Plan | Price | Messages/day |
|---|---|---|
| Free | ₹0 | 10 |
| Pro | ₹99/month | 30 |

To upgrade a user to Pro, add their Gmail to the `PRO_USERS` env var and redeploy.

---

## Tech Stack

- **Frontend** — Single HTML file (HTML + CSS + JS, no framework)
- **Backend** — Node.js + Express
- **AI** — Ollama Cloud (`deepseek-v3.2:cloud`)
- **Web Search** — Tavily API
- **Auth** — Google OAuth 2.0
- **Voice** — Web Speech API (Chrome/Edge only)
- **Design** — Light/dark mode, Allen.in inspired

---

## Project Structure

```
arese-ai/
├── arese-ai.html   # entire frontend (one file)
├── index.js        # Express server + Ollama API + auth + usage limits
├── package.json    # dependencies
└── README.md
```

---

## Environment Variables

| Key | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (set to `3000`) |
| `OLLAMA_API_KEY` | Yes | From ollama.com/settings/api-keys |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud Console (OAuth 2.0) |
| `TAVILY_API_KEY` | No | From tavily.com — enables web search |
| `PRO_USERS` | No | Comma-separated Gmail addresses with Pro access |

Example `PRO_USERS` value:
```
you@gmail.com,friend@gmail.com
```

---

## Google OAuth Setup

1. Go to **console.cloud.google.com**
2. Create a new project → name it `Arese AI`
3. APIs & Services → **OAuth consent screen** → External → fill app name
4. APIs & Services → **Credentials** → Create → **OAuth 2.0 Client ID** → Web application
5. Add your Render URL to **Authorized JavaScript origins**:
   ```
   https://arese-ai.onrender.com
   ```
6. Copy the **Client ID** and add it to:
   - Render env var: `GOOGLE_CLIENT_ID`
   - `arese-ai.html`: find `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` and replace it

---

## Local Setup

**Prerequisites:** Node.js installed

```bash
# 1. Clone the repo
git clone https://github.com/KemicArese/arese-ai
cd arese-ai

# 2. Install dependencies
npm install

# 3. Set env vars (create a .env file or export manually)
export OLLAMA_API_KEY=your_key
export GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
export TAVILY_API_KEY=your_tavily_key   # optional
export PRO_USERS=you@gmail.com          # optional

# 4. Start the server
node index.js
```

Then open `http://localhost:3000` in Chrome or Edge.

---

## Deploy on Render

1. Push all files to a GitHub repo
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---|---|
| Environment | Node |
| Build Command | `npm install` |
| Start Command | `node index.js` |

5. Add environment variables:

| Key | Value |
|---|---|
| `PORT` | `3000` |
| `OLLAMA_API_KEY` | your Ollama key |
| `GOOGLE_CLIENT_ID` | your Google Client ID |
| `TAVILY_API_KEY` | your Tavily key (optional) |
| `PRO_USERS` | comma-separated Gmail addresses (optional) |

6. Hit **Create Web Service** → live at `https://arese-ai.onrender.com`

---

## How Usage Limits Work

- Every user signs in with Google — usage is tracked per Gmail address
- Free users: **10 messages/day**, resets at midnight
- Pro users: **30 messages/day**, resets at midnight
- Limits enforced on **both frontend and backend**
- Backend verifies Google token on every `/api/chat` request
- Returns `429` with `limitReached: true` when limit is exceeded
- Pro modal opens automatically when limit is hit

---

## Notes

- Voice Mode works best in **Chrome or Edge** (Web Speech API required)
- Web Search only triggers when user manually enables the 🌐 skill in General AI Chat
- Usage resets daily — server-side counts reset on restart (use a DB for persistence in production)
- To add Pro users: update `PRO_USERS` env var on Render and redeploy

---

## Made by

**KemicArese** — [github.com/KemicArese](https://github.com/KemicArese)
