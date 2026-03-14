const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

app.use(express.json());

// Serve the HTML frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'arese-ai.html'));
});

// API route — called by the frontend
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v3.2:cloud',
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Ollama API error:', response.status, errText);
      return res.status(500).json({ error: `Ollama error ${response.status}: ${errText}` });
    }

    const data = await response.json();
    console.log('Ollama response:', JSON.stringify(data).slice(0, 200));

    const content = data?.message?.content || '';
    if (!content) {
      console.error('Empty content, full response:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response from Ollama. Full: ' + JSON.stringify(data) });
    }

    res.json({ content });

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Arese.AI running on port ${PORT}`);
  console.log(`✓ Ollama API key: ${OLLAMA_API_KEY ? 'set ✓' : 'MISSING ✗'}`);
});
