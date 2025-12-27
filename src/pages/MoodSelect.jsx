import { IonPage, IonContent, IonButton, IonGrid, IonRow, IonCol, IonLabel, IonToast, IonItem, IonInput } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Mood.css';
import { evaluateMood } from '../utils/mood';
import TopBar from '../components/TopBar.jsx';
import { API_BASE } from '../config/api';

const moods = [
  { key: 'happy', label: '😊 Happy' },
  { key: 'sad', label: '😢 Sad' },
  { key: 'stressed', label: '😣 Stress' },
  { key: 'tired', label: '😴 Tired' },
  { key: 'excited', label: '🤩 Excited' },
  { key: 'angry', label: '😡 Angry' },
  { key: 'bored', label: '😐 Bored' },
  { key: 'energetic', label: '⚡ Energetic' },
];

const MoodSelect = () => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(false);
  const [customMood, setCustomMood] = useState('');

  const selectMood = (m, opts = {}) => {
    const moodKey = (m || '').toString().toLowerCase().trim() || 'neutral';
    // if selecting a preset, clear any previous custom mood flags
    if (opts.preset) {
      localStorage.removeItem('currentMoods');
      localStorage.removeItem('isCustomMood');
    }
    // store selected mood and navigate to suggestions
    localStorage.setItem('currentMood', moodKey);
    // add to moodHistory now so timestamp is recorded when selecting
    const historyArr = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    historyArr.push({ mood: moodKey, suggestions: [], date: new Date().toISOString() });
    localStorage.setItem('moodHistory', JSON.stringify(historyArr));
    history.push('/suggestions');
    setShowToast(true);
  };

  // Note: removed direct "Find desserts" flow — users should use AI chat (Ask AI) or preset buttons.

  const askAi = async () => {
    if (!customMood || !customMood.toString().trim()) {
      setShowToast(true);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/api/mood-suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customMood, limit: 5 })
      });
      const data = await resp.json();
      if (!data || !data.ok) throw new Error(data?.error || 'AI error');
      const detected = data.result.moods || [];
      const suggestions = Array.isArray(data.result.suggestions) ? data.result.suggestions : [];
      // persist AI suggestions so Suggestions page can use them
      localStorage.setItem('currentMoods', JSON.stringify(detected));
      localStorage.setItem('aiSuggestions', JSON.stringify(suggestions));
      localStorage.setItem('isCustomMood', 'true');
      // push a history entry (AI-assisted)
      const primary = detected && detected.length ? detected[0] : 'neutral';
      const historyArr = JSON.parse(localStorage.getItem('moodHistory') || '[]');
      historyArr.push({ mood: primary, suggestions: suggestions, date: new Date().toISOString(), via: 'ai' });
      localStorage.setItem('moodHistory', JSON.stringify(historyArr));
      history.push('/suggestions');
      setShowToast(true);
    } catch (e) {
      console.error('AI request failed', e);
      setShowToast(true);
    }
  };

  return (
    <IonPage className="mood-page">
      <TopBar />
      <IonContent className="ion-padding">
        <div className="hero">
          <div className="logo">CraveMate</div>
          <div className="sub">How are you feeling today?</div>
        </div>
        <IonGrid className="mood-grid">
          <IonRow>
            {moods.map((m) => (
              <IonCol size="6" key={m.key} className="mood-col">
                <IonButton className="mood-btn" expand="block" onClick={() => selectMood(m.key, { preset: true })}>
                  <IonLabel>{m.label}</IonLabel>
                </IonButton>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        <div className="custom-mood">
          <IonItem>
            <IonLabel position="stacked">Or type your mood</IonLabel>
            <IonInput placeholder="Mood" value={customMood} onIonChange={(e) => setCustomMood(e.detail.value)} />
          </IonItem>
          <div style={{ marginTop: 12 }}>
            <IonButton expand="block" color="tertiary" onClick={askAi} style={{ marginTop: 8 }}>Ask AI (chat)</IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message="Mood selected" duration={900} />
      </IonContent>
    </IonPage>
  );
};

export default MoodSelect;
