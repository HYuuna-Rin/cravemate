import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 5174;

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) console.warn('Warning: OPENAI_API_KEY not set. AI endpoint will fail without it.');

const client = new OpenAI({ apiKey: OPENAI_KEY });

// load foods.json once
const foodsPath = path.join(process.cwd(), 'src', 'assets', 'data', 'foods.json');
let foods = [];
try { foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8')); } catch (e) { console.error('Could not load foods.json', e); }

app.post('/api/mood-suggest', async (req, res) => {
  const { text, limit = 5 } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });
  if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });

  // Prepare a compact foods list to include in the prompt: name and moods
  const compact = foods.map(f => ({ name: f.name, moods: f.moods || [], reason: f.reason || '' }));

  const system = `You are a helpful assistant that reads a user's description of their mood and suggests appropriate desserts from a provided list. Always respond with a JSON object only.
Return the detected moods (array) and up to ${limit} suggestions in order of relevance. Each suggestion should be an object with keys: name, reason (brief). If none match, return an empty suggestions array.
Here is the foods list (JSON):`;

  const user = `User text: "${text.replace(/\"/g, '\\"')}"\n\nFoods list JSON: ${JSON.stringify(compact)}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      max_tokens: 400,
      temperature: 0.6
    });

    const textResp = response.choices?.[0]?.message?.content || '';
    // try to parse JSON out of model response
    let parsed;
    try { parsed = JSON.parse(textResp); } catch (e) {
      // try to extract first JSON-looking substring
      const m = textResp.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (err) { parsed = { moods: [], suggestions: [] }; }
      } else parsed = { moods: [], suggestions: [] };
    }

    // enrich suggestions with image paths from foods list when possible
    if (Array.isArray(parsed.suggestions)) {
      parsed.suggestions = parsed.suggestions.map(s => {
        const found = foods.find(f => f.name.toLowerCase() === (s.name || '').toString().toLowerCase());
        return {
          name: s.name,
          reason: s.reason || (found && found.reason) || '',
          image: (found && found.image) || (s.image || '')
        };
      });
    }

    return res.json({ ok: true, result: parsed, raw: textResp });
  } catch (err) {
    console.error('OpenAI error', err);
    return res.status(500).json({ error: 'OpenAI request failed', detail: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy server listening on http://localhost:${PORT}`);
});
