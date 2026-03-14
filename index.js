const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const FREE_LIMIT = 10;
const PRO_LIMIT = 30;

// In-memory usage store: { email: { count, date, isPro } }
const usageStore = {};

// Add Gmail addresses here to grant Pro access manually
const PRO_USERS = new Set([
  // 'someone@gmail.com',
]);

app.use(express.json());

// ── helpers ──────────────────────────────────────────────────

async function verifyGoogleToken(token) {
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
  if (!r.ok) throw new Error('Invalid Google token');
  const data = await r.json();
  if (data.aud !== GOOGLE_CLIENT_ID) throw new Error('Token client ID mismatch');
  return { email: data.email, name: data.name };
}

function getUsage(email) {
  const today = new Date().toDateString();
  if (!usageStore[email] || usageStore[email].date !== today) {
    usageStore[email] = { count: 0, date: today };
  }
  return usageStore[email];
}

function getLimit(email) {
  return PRO_USERS.has(email) ? PRO_LIMIT : FREE_LIMIT;
}

async function ollamaChat(messages) {
  const r = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OLLAMA_API_KEY}`
    },
    body: JSON.stringify({ model: 'deepseek-v3.2:cloud', messages, stream: false })
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Ollama error ${r.status}: ${errText}`);
  }
  const data = await r.json();
  return data?.message?.content || data?.message?.thinking || '';
}

async function tavilySearch(query) {
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: TAVILY_API_KEY, query, search_depth: 'basic', max_results: 4, include_answer: true })
  });
  if (!r.ok) throw new Error(`Tavily error ${r.status}`);
  return await r.json();
}

// ── routes ───────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'arese-ai.html'));
});

// Usage status endpoint — called on login
app.post('/api/usage', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });
    const user = await verifyGoogleToken(token);
    const usage = getUsage(user.email);
    const limit = getLimit(user.email);
    res.json({
      email: user.email,
      isPro: PRO_USERS.has(user.email),
      used: usage.count,
      remaining: Math.max(0, limit - usage.count),
      limit
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, enableSearch = false, googleToken } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // ── Auth & server-side limit check ──
    let userEmail = null;
    if (googleToken) {
      try {
        const user = await verifyGoogleToken(googleToken);
        userEmail = user.email;
      } catch {
        return res.status(401).json({ error: 'Invalid Google token. Please sign in again.' });
      }

      const usage = getUsage(userEmail);
      const limit = getLimit(userEmail);

      if (usage.count >= limit) {
        return res.status(429).json({
          error: `Daily limit reached (${limit} messages/day). Upgrade to Pro for 30/day.`,
          limitReached: true,
          remaining: 0,
          limit
        });
      }

      usage.count++;
    }

    // ── Web search ──
    let searched = false;
    let searchResults = null;
    let finalMessages = [...messages];
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUser?.content || '';

    if (enableSearch && TAVILY_API_KEY && userText) {
      try {
        console.log('🔍 Web search:', userText);
        const results = await tavilySearch(userText);
        searchResults = results;
        searched = true;
        const sourcesText = (results.results || [])
          .map((r, i) => `[${i+1}] ${r.title}\n${r.url}\n${r.content}`)
          .join('\n\n');
        const webContext = `Today's date: ${new Date().toDateString()}.\nWeb search results for "${userText}":\n\n${results.answer ? `Summary: ${results.answer}\n\n` : ''}${sourcesText}\n\nUse these results to answer accurately. Cite sources as [1], [2] etc.`;
        finalMessages = [...messages.slice(0, -1), { role: 'system', content: webContext }, lastUser];
      } catch (err) {
        console.warn('Web search failed:', err.message);
      }
    }

    // ── AI call ──
    const content = await ollamaChat(finalMessages);
    if (!content) return res.status(500).json({ error: 'Empty response from Ollama' });

    const remaining = userEmail ? Math.max(0, getLimit(userEmail) - getUsage(userEmail).count) : null;

    res.json({
      content,
      searched,
      sources: searched ? (searchResults?.results || []).map(r => ({ title: r.title, url: r.url })) : [],
      remaining,
      limit: userEmail ? getLimit(userEmail) : null
    });

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Arese.AI running on port ${PORT}`);
  console.log(`✓ Ollama API key: ${OLLAMA_API_KEY ? 'set ✓' : 'MISSING ✗'}`);
  console.log(`✓ Tavily web search: ${TAVILY_API_KEY ? 'enabled ✓' : 'disabled'}`);
  console.log(`✓ Google Client ID: ${GOOGLE_CLIENT_ID.includes('YOUR_') ? 'placeholder — set GOOGLE_CLIENT_ID env var ✗' : 'set ✓'}`);
});
