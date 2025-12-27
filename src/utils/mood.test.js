import { evaluateMood, moodKeywords } from './mood';

describe('evaluateMood', () => {
  test('detects multiple moods from sentence', () => {
    const input = 'I feel overwhelmed and exhausted today';
    const detected = evaluateMood(input);
    expect(Array.isArray(detected)).toBe(true);
    expect(detected).toEqual(expect.arrayContaining(['stressed','tired']));
  });

  test('returns neutral when nothing matches', () => {
    const input = 'I am undecided about food';
    const detected = evaluateMood(input);
    expect(detected).toEqual(['neutral']);
  });

  test('is case-insensitive and matches keywords', () => {
    const input = 'Feeling SAD and down';
    const detected = evaluateMood(input);
    expect(detected).toEqual(expect.arrayContaining(['sad']));
  });

  test('every moodKeyword has at least one keyword', () => {
    for (const k of Object.keys(moodKeywords)) {
      expect(Array.isArray(moodKeywords[k])).toBe(true);
      expect(moodKeywords[k].length).toBeGreaterThan(0);
    }
  });
});
