export const moodKeywords = {
  sad: ["sad", "down", "lonely", "heartbroken", "depressed", "cry"],
  stressed: ["stressed", "overwhelmed", "pressure", "anxious", "tense", "overworked"],
  tired: ["tired", "exhausted", "sleepy", "drained", "fatigued", "weary", "spent"],
  happy: ["happy", "good", "great", "joyful", "cheerful", "content", "joy"],
  excited: ["excited", "thrilled", "energetic", "pumped", "eager"],
  bored: ["bored", "nothing to do", "lazy", "idle", "meh"]
};

export function evaluateMood(input) {
  if (!input || !input.toString) return ['neutral'];
  const text = input.toString().toLowerCase();
  const detected = [];

  for (const mood in moodKeywords) {
    for (const keyword of moodKeywords[mood]) {
      if (text.includes(keyword)) {
        detected.push(mood);
        break;
      }
    }
  }

  return detected.length > 0 ? detected : ['neutral'];
}

export default { moodKeywords, evaluateMood };
