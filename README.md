# Arese.AI — Student Intelligence Platform

A single-file AI-powered web app built for students. Includes 9 tools powered by **Ollama Cloud** (DeepSeek v3.2), served via a Node.js + Express backend.

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
| ✦ General AI Chat | Ask anything — all-purpose AI assistant |
| 🎙 Voice Mode | Speak in English or Hindi, hear replies |

---

## Tech Stack

- **Frontend** — Single HTML file (HTML + CSS + JS, no framework)
- **Backend** — Node.js + Express
- **AI** — Ollama Cloud (`deepseek-v3.2:cloud`)
- **Voice** — Web Speech API (Chrome/Edge only)
- **Design** — Light/dark mode, Allen.in inspired

---

## Project Structure

```
arese-ai/
├── arese-ai.html   # entire frontend (one file)
├── index.js        # Express server + Ollama API calls
├── package.json    # dependencies
└── README.md
```

---

## Local Setup

**Prerequisites:** Node.js installed, Ollama installed and signed in

```bash
# 1. Clone the repo
git clone https://github.com/KemicArese/arese-ai
cd arese-ai

# 2. Install dependencies
npm install

# 3. Sign in to Ollama (one time only)
ollama signin

# 4. Start the server
node index.js
```

Then open `http://localhost:3000` in Chrome or Edge.

---

## Deploy on Render

1. Push all files to a GitHub repo
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Set the following:

| Setting | Value |
|---|---|
| Environment | Node |
| Build Command | `npm install` |
| Start Command | `node index.js` |

5. Add one environment variable:

| Key | Value |
|---|---|
| PORT | 3000 |

6. Hit **Create Web Service** — you'll get a live URL like `https://arese-ai.onrender.com`

---

## Notes

- Voice Mode works best in **Chrome or Edge** (Web Speech API required)
- The AI calls are made server-side (Node.js → Ollama Cloud), so no CORS issues
- Light mode is default, dark mode toggle is in the top-right nav
- All 9 tools share the same backend — no separate API keys needed

---

## Made by

**KemicArese** — [github.com/KemicArese](https://github.com/KemicArese)
