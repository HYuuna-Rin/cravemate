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

const PORT = process.env.PORT || 5000;

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. AI endpoint will fail.');
}

const client = new OpenAI({ apiKey: OPENAI_KEY });

/* ---------------------------
   Load foods.json (once)
---------------------------- */
const foodsPath = path.join(
  process.cwd(),
  'src',
  'assets',
  'data',
  'foods.json'
);

let foods = [];
try {
  foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
  console.log(`Loaded ${foods.length} foods`);
} catch (err) {
  console.error('❌ Failed to load foods.json', err);
}

/* ---------------------------
   POST /api/mood-suggest
---------------------------- */
app.post('/api/mood-suggest', async (req, res) => {
  const { text, limit = 5 } = req.body || {};

  if (!text || !text.toString().trim()) {
    return res.status(400).json({ ok: false, error: 'Missing mood text' });
  }

  if (!OPENAI_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'Server missing OPENAI_API_KEY'
    });
  }

  // Compact list for prompt (keep tokens low)
  const compactFoods = foods.map(f => ({
    name: f.name,
    moods: f.moods || [],
    reason: f.reason || ''
  }));

  const systemPrompt = `
You analyze a user's mood description and recommend desserts
ONLY from the provided list.

Rules:
- Respond with JSON ONLY
- No markdown
- No explanation text
- Max ${limit} suggestions

JSON format:
{
  "moods": ["happy", "sad"],
  "suggestions": [
    { "name": "Dessert Name", "reason": "Short explanation" }
  ]
}
`;

  const userPrompt = `
User mood description:
"${text.replace(/"/g, '\\"')}"

Available desserts:
${JSON.stringify(compactFoods)}
`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 400
    });

    const raw = completion.choices?.[0]?.message?.content || '';

    // Attempt JSON parse
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = { moods: [], suggestions: [] };
        }
      } else {
        parsed = { moods: [], suggestions: [] };
      }
    }

    // Enrich suggestions with images from foods.json
    if (Array.isArray(parsed.suggestions)) {
      parsed.suggestions = parsed.suggestions.map(s => {
        const found = foods.find(
          f => f.name.toLowerCase() === (s.name || '').toLowerCase()
        );

        return {
          name: s.name,
          reason: s.reason || found?.reason || '',
          image: found?.image || ''
        };
      });
    }

    return res.json({
      ok: true,
      result: parsed
    });

  } catch (err) {
    console.error('❌ OpenAI request failed:', err);
    return res.status(500).json({
      ok: false,
      error: 'OpenAI request failed',
      detail: err?.message || String(err)
    });
  }
});

/* ---------------------------
   Start server
---------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 AI server running on port ${PORT}`);
});
