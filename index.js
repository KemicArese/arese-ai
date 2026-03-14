const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

app.use(express.json());

// ── helpers ──────────────────────────────────────────────────

async function ollamaChat(messages) {
  const response = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OLLAMA_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-v3.2:cloud',
      messages,
      stream: false
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  return data?.message?.content || data?.message?.thinking || '';
}

async function tavilySearch(query) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 4,
      include_answer: true
    })
  });
  if (!response.ok) throw new Error(`Tavily error ${response.status}`);
  return await response.json();
}

async function needsWebSearch(userMessage) {
  // Ask DeepSeek if this query needs fresh/real-world info
  const decision = await ollamaChat([{
    role: 'system',
    content: `You decide if a question needs a live web search to answer accurately.
Reply with ONLY "YES" or "NO". No explanation.
Answer YES for: current events, news, prices, weather, recent releases, sports scores, live data, anything that changes over time.
Answer NO for: general knowledge, math, concepts, history, writing help, coding, studying.`
  }, {
    role: 'user',
    content: userMessage
  }]);
  return decision.trim().toUpperCase().startsWith('YES');
}

// ── routes ───────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'arese-ai.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, enableSearch = true } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Last user message
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUser?.content || '';

    let searched = false;
    let searchResults = null;
    let finalMessages = [...messages];

    // Auto web search for General AI Chat (only when Tavily key is set)
    if (enableSearch && TAVILY_API_KEY && userText) {
      try {
        const shouldSearch = await needsWebSearch(userText);
        if (shouldSearch) {
          console.log('🔍 Searching web for:', userText);
          const results = await tavilySearch(userText);
          searchResults = results;
          searched = true;

          // Build context from search results
          const sourcesText = (results.results || [])
            .map((r, i) => `[${i+1}] ${r.title}\n${r.url}\n${r.content}`)
            .join('\n\n');

          const webContext = `Today's date: ${new Date().toDateString()}.
Web search results for "${userText}":

${results.answer ? `Summary: ${results.answer}\n\n` : ''}${sourcesText}

Use the above search results to answer the user's question accurately. Cite sources as [1], [2] etc where relevant.`;

          // Inject web context as a system message before the last user message
          finalMessages = [
            ...messages.slice(0, -1),
            { role: 'system', content: webContext },
            lastUser
          ];
        }
      } catch (searchErr) {
        console.warn('Web search failed, continuing without it:', searchErr.message);
      }
    }

    const content = await ollamaChat(finalMessages);
    if (!content) {
      return res.status(500).json({ error: 'Empty response from Ollama' });
    }

    res.json({
      content,
      searched,
      sources: searched ? (searchResults?.results || []).map(r => ({ title: r.title, url: r.url })) : []
    });

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Arese.AI running on port ${PORT}`);
  console.log(`✓ Ollama API key: ${OLLAMA_API_KEY ? 'set ✓' : 'MISSING ✗'}`);
  console.log(`✓ Tavily web search: ${TAVILY_API_KEY ? 'enabled ✓' : 'disabled (no key)'}`);
});
