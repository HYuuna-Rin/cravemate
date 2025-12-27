// Lightweight DB service: uses Capacitor SQLite when available, falls back to localStorage.
// Provides init(), seedFoodsFromJSON, getSuggestionsByMood, saveFavorite, getFavorites, saveHistoryEntry, getHistory

import foods from '../assets/data/foods.json';

let useSqlite = false;
let sqlite = null;
let db = null;

async function init() {
  try {
    const mod = await import('@capacitor-community/sqlite');
    sqlite = mod && mod.CapacitorSQLite ? mod : null;
    if (sqlite) {
      useSqlite = true;
      const { CapacitorSQLite } = sqlite;
      db = await CapacitorSQLite.createConnection({ database: 'cravemate_db' });
      await db.open();
      // create tables if not exist
      await db.execute('CREATE TABLE IF NOT EXISTS foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, moods TEXT, energy TEXT, reason TEXT, image TEXT);');
      await db.execute('CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, mood TEXT, date TEXT, data TEXT);');
      await db.execute('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, mood TEXT, date TEXT, suggestions TEXT);');
      await seedFoodsIfEmpty();
      return true;
    }
  } catch (e) {
    useSqlite = false;
  }
  // fallback -> nothing to init for localStorage
  return false;
}

async function seedFoodsIfEmpty() {
  if (!useSqlite || !db) return;
  try {
    const res = await db.query('SELECT COUNT(*) as c FROM foods;');
    const count = res && res.values && res.values[0] && res.values[0].c ? res.values[0].c : 0;
    if (count === 0) {
      // insert foods from JSON
      const stmts = [];
      for (const f of foods) {
        const moods = JSON.stringify(f.moods || []);
        const image = f.image || '';
        const reason = f.reason || '';
        stmts.push([`INSERT INTO foods (name, category, moods, energy, reason, image) VALUES (?,?,?,?,?,?);`, [f.name, f.category.toLowerCase(), moods, f.energy || '', reason, image]]);
      }
      for (const [sql, params] of stmts) {
        await db.run(sql, params);
      }
    }
  } catch (e) {
    // ignore
  }
}

async function getSuggestionsByMood(mood, limit = 3) {
  // prefer sqlite, else filter local JSON
  if (useSqlite && db) {
    try {
      const rows = await db.query('SELECT name, category, moods, energy, reason, image FROM foods WHERE category = ?;', ['dessert']);
      const list = (rows && rows.values) ? rows.values.map(r => ({ name: r.name, category: r.category, moods: JSON.parse(r.moods || '[]'), energy: r.energy, reason: r.reason, image: r.image })) : [];
      const filtered = list.filter(f => Array.isArray(f.moods) && f.moods.includes(mood));
      const chosen = (filtered.length ? filtered : list).sort(() => 0.5 - Math.random()).slice(0, limit);
      return chosen;
    } catch (e) {
      // fallback to JSON
    }
  }
  // fallback to in-memory foods.json
  const list = Array.isArray(foods) ? foods.filter(f => f.category.toLowerCase() === 'dessert') : [];
  const filtered = list.filter(f => Array.isArray(f.moods) && f.moods.includes(mood));
  const chosen = (filtered.length ? filtered : list).sort(() => 0.5 - Math.random()).slice(0, limit);
  return chosen;
}

async function saveFavorite(obj) {
  try {
    if (useSqlite && db) {
      const data = JSON.stringify(obj || {});
      const name = obj.name || '';
      const mood = obj.mood || '';
      const date = new Date().toISOString();
      await db.run('INSERT INTO favorites (name, mood, date, data) VALUES (?,?,?,?);', [name, mood, date, data]);
      return true;
    }
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    favs.push({ ...obj, date: new Date().toISOString() });
    localStorage.setItem('favorites', JSON.stringify(favs));
    return true;
  } catch (e) {
    return false;
  }
}

async function getFavorites() {
  try {
    if (useSqlite && db) {
      const rows = db.query ? await db.query('SELECT id, name, mood, date, data FROM favorites ORDER BY date DESC;') : null;
      if (rows && rows.values) return rows.values.map(r => ({ id: r.id, name: r.name, mood: r.mood, date: r.date, data: r.data ? JSON.parse(r.data) : null }));
    }
  } catch (e) {
    // fallback
  }
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

async function saveHistoryEntry(mood, suggestions) {
  try {
    if (useSqlite && db) {
      const payload = JSON.stringify(suggestions || []);
      const date = new Date().toISOString();
      await db.run('INSERT INTO history (mood, date, suggestions) VALUES (?,?,?);', [mood, date, payload]);
      return true;
    }
    const hist = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    hist.push({ mood, suggestions, date: new Date().toISOString() });
    localStorage.setItem('moodHistory', JSON.stringify(hist));
    return true;
  } catch (e) {
    return false;
  }
}

async function deleteFavorite(name, mood) {
  try {
    if (useSqlite && db) {
      await db.run('DELETE FROM favorites WHERE name = ? AND mood = ?;', [name, mood]);
      return true;
    }
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    const filtered = favs.filter(f => !(f.name === name && f.mood === mood));
    localStorage.setItem('favorites', JSON.stringify(filtered));
    return true;
  } catch (e) {
    return false;
  }
}

async function getHistory() {
  try {
    if (useSqlite && db) {
      const rows = await db.query('SELECT id, mood, date, suggestions FROM history ORDER BY date DESC;');
      if (rows && rows.values) return rows.values.map(r => ({ id: r.id, mood: r.mood, date: r.date, suggestions: r.suggestions ? JSON.parse(r.suggestions) : [] }));
    }
  } catch (e) {}
  return JSON.parse(localStorage.getItem('moodHistory') || '[]');
}

async function deleteHistoryByDate(date) {
  try {
    if (useSqlite && db) {
      await db.run('DELETE FROM history WHERE date = ?;', [date]);
      return true;
    }
  } catch (e) {}
  const hist = JSON.parse(localStorage.getItem('moodHistory') || '[]');
  const filtered = hist.filter(h => h.date !== date);
  localStorage.setItem('moodHistory', JSON.stringify(filtered));
  return true;
}

async function clearHistory() {
  try {
    if (useSqlite && db) {
      await db.run('DELETE FROM history;');
      return true;
    }
  } catch (e) {}
  localStorage.removeItem('moodHistory');
  return true;
}

async function updateHistorySuggestions(date, suggestions) {
  try {
    if (useSqlite && db) {
      const payload = JSON.stringify(suggestions || []);
      await db.run('UPDATE history SET suggestions = ? WHERE date = ?;', [payload, date]);
      return true;
    }
  } catch (e) {}
  try {
    const hist = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    const idx = hist.findIndex(h => h.date === date);
    if (idx !== -1) {
      hist[idx].suggestions = suggestions || [];
      localStorage.setItem('moodHistory', JSON.stringify(hist));
      return true;
    }
  } catch (e) {}
  return false;
}

export default {
  init,
  getSuggestionsByMood,
  saveFavorite,
  getFavorites,
  saveHistoryEntry,
  getHistory,
  deleteHistoryByDate,
  clearHistory,
  updateHistorySuggestions,
};
