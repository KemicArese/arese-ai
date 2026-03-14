const express = require('express');
const { Ollama } = require('ollama');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Use API key from environment variable
const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: {
    'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
  }
});

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

    const response = await ollama.chat({
      model: 'deepseek-v3.2:cloud',
      messages: messages,
    });

    res.json({ content: response.message.content });

  } catch (err) {
    console.error('Ollama error:', err.message);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Arese.AI running on port ${PORT}`);
});
