import db from './db';

describe('db localStorage fallback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saveHistoryEntry and getHistory via localStorage', async () => {
    const mood = 'happy';
    const suggestions = [{ name: 'Cake' }];
    const saved = await db.saveHistoryEntry(mood, suggestions);
    expect(saved).toBe(true);
    const hist = await db.getHistory();
    expect(Array.isArray(hist)).toBe(true);
    expect(hist.length).toBeGreaterThan(0);
    expect(hist[hist.length-1].mood).toBe(mood);
    expect(Array.isArray(hist[hist.length-1].suggestions)).toBe(true);
  });

  test('deleteHistoryByDate removes entry', async () => {
    const mood = 'sad';
    const suggestions = [{ name: 'Pie' }];
    await db.saveHistoryEntry(mood, suggestions);
    const hist1 = await db.getHistory();
    const last = hist1[hist1.length-1];
    expect(last).toBeDefined();
    const ok = await db.deleteHistoryByDate(last.date);
    expect(ok).toBe(true);
    const hist2 = await db.getHistory();
    expect(hist2.find(h => h.date === last.date)).toBeUndefined();
  });

  test('clearHistory clears all', async () => {
    await db.saveHistoryEntry('tired', [{ name: 'Cookie' }]);
    await db.saveHistoryEntry('bored', [{ name: 'Donut' }]);
    let h = await db.getHistory();
    expect(h.length).toBeGreaterThanOrEqual(2);
    const ok = await db.clearHistory();
    expect(ok).toBe(true);
    h = await db.getHistory();
    expect(h.length).toBe(0);
  });
});
