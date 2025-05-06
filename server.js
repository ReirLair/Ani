const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 2776;
const JIKAN_BASE = 'https://api.jikan.moe/v4';

app.use(cors());
app.use(express.static('public')); // Serve index.html and static files

// 1. Get popular anime
app.get('/api/popular', async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE}/top/anime`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch popular anime.' });
  }
});

app.get('/anime/:id/:episode', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// 2. Search anime
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query is required.' });

  try {
    const response = await axios.get(`${JIKAN_BASE}/anime`, {
      params: { q: query }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search anime.' });
  }
});

// 3. Get anime info by ID
app.get('/api/anime/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const response = await axios.get(`${JIKAN_BASE}/anime/${id}`);
    res.json(response.data.data); // Full anime info
  } catch (err) {
    res.status(500).json({ error: 'Anime not found.' });
  }
});

// 4. General anime recommendations (using top anime as proxy)

// 4. Use real Jikan API recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE}/recommendations/anime`);
    const groups = response.data.data;

    const recommended = [];

    for (const group of groups) {
      for (const anime of group.entry) {
        recommended.push({
          mal_id: anime.mal_id,
          title: anime.title,
          image_url: anime.images?.jpg?.image_url || null
        });
      }
    }

    // Remove duplicates by mal_id
    const seen = new Set();
    const unique = recommended.filter(anime => {
      if (seen.has(anime.mal_id)) return false;
      seen.add(anime.mal_id);
      return true;
    });

    res.json({ data: unique.slice(0, 30) }); // limit to 30 results
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch real anime recommendations.' });
  }
});

// 5. Convert anime name to ID
app.get('/api/id/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const response = await axios.get(`${JIKAN_BASE}/anime`, {
      params: { q: name }
    });
    const anime = response.data.data[0]; // Get first search result
    if (!anime) return res.status(404).json({ error: 'Anime not found.' });
    res.json({ id: anime.mal_id, title: anime.title });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch anime ID.' });
  }
});

app.listen(PORT, () => {
  console.log(`Anime backend running at http://localhost:${PORT}`);
});
