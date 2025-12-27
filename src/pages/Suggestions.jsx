import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonAvatar, IonImg, IonButton, IonToast, IonIcon, IonAlert } from '@ionic/react';
import { useState, useEffect } from 'react';
import { heart, heartOutline, star } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import './Suggestions.css';
import TopBar from '../components/TopBar.jsx';

import foodsDB from '../assets/data/foods.json';
import db from '../services/db';
// foods.json is the single offline data source for desserts/foods

const Suggestions = () => {
  const history = useHistory();
  const [mood, setMood] = useState(localStorage.getItem('currentMood') || 'happy');
  const [items, setItems] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [showRemoveAlert, setShowRemoveAlert] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  const location = useLocation();
  const [isCustom, setIsCustom] = useState(localStorage.getItem('isCustomMood') === 'true');

  // allowed mood keys for consistency with MoodSelect options
  const allowedMoods = ['happy','sad','stressed','tired','excited','angry','bored','energetic','neutral'];

  const computeDisplayMood = (tryMoods, fallback) => {
    if (!tryMoods) return fallback || 'neutral';
    // first exact match
    for (const m of tryMoods) if (allowedMoods.includes(m)) return m;
    // fuzzy: substring match
    for (const m of tryMoods) {
      const low = m.toString().toLowerCase();
      for (const a of allowedMoods) if (low.includes(a) || a.includes(low)) return a;
    }
    return fallback || 'neutral';
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const current = localStorage.getItem('currentMood') || mood;
      const customFlag = localStorage.getItem('isCustomMood') === 'true';
      const currentMoods = JSON.parse(localStorage.getItem('currentMoods') || 'null');
      setMood(current);
      setIsCustom(customFlag);
      // initialize db (will noop if sqlite not available)
      try { await db.init(); } catch (e) {}

      const tryMoods = Array.isArray(currentMoods) && currentMoods.length ? currentMoods : [current];
      // compute display mood for top-left heading
      const displayMood = computeDisplayMood(tryMoods, current);
      setMood(displayMood);
      
      // check for AI-provided suggestions (from MoodSelect askAi flow)
      const aiSuggestions = JSON.parse(localStorage.getItem('aiSuggestions') || 'null');
      if (Array.isArray(aiSuggestions) && aiSuggestions.length) {
        // use AI suggestions directly and clear the transient key
        localStorage.removeItem('aiSuggestions');
        setItems(aiSuggestions);
        try { const f = await db.getFavorites(); setFavoritesList(Array.isArray(f) ? f : []); } catch (e) { setFavoritesList(JSON.parse(localStorage.getItem('favorites') || '[]')); }
        // notify history updated (MoodSelect already pushed an AI history entry)
        try { window.dispatchEvent(new CustomEvent('historyUpdated')); } catch (e) {}
        return;
      }
      const limit = 3;
      let collected = [];

      // try DB first, iterating detected moods to collect unique suggestions
      if (db) {
        for (const m of tryMoods) {
          try {
            const res = await db.getSuggestionsByMood(m, limit);
            if (res && res.length) {
              for (const it of res) {
                if (!collected.find(x => x.name === it.name)) collected.push(it);
                if (collected.length >= limit) break;
              }
            }
          } catch (e) {}
          if (collected.length >= limit) break;
        }
      }

      // fallback to local JSON if nothing found
      if (!collected.length) {
        const source = Array.isArray(foodsDB) ? foodsDB : [];
        // try matching any of the detected moods
        const matched = source.filter(f => f.category && f.category.toLowerCase() === 'dessert' && Array.isArray(f.moods) && tryMoods.some(tm => f.moods.includes(tm)));
        if (matched && matched.length) {
          collected = matched.sort(() => 0.5 - Math.random()).slice(0, limit);
        } else {
          const allDesserts = source.filter(f => f.category && f.category.toLowerCase() === 'dessert');
          collected = allDesserts.sort(() => 0.5 - Math.random()).slice(0, limit);
        }
      }

      if (mounted) {
        setItems(collected);
        // persist into history: update last pending entry if present, else insert new
        const primaryMood = tryMoods && tryMoods.length ? tryMoods[0] : current;
        try {
          // fetch recent history to decide whether to update last entry
          const hist = await db.getHistory().catch(() => JSON.parse(localStorage.getItem('moodHistory')||'[]')) || [];
          let last = null;
          if (Array.isArray(hist) && hist.length) {
            // db.getHistory returns newest-first for sqlite; localStorage stores oldest-first — pick the newest
            const first = hist[0];
            const lastItem = hist[hist.length-1];
            if (first && lastItem && new Date(first.date) > new Date(lastItem.date)) last = first; else last = lastItem;
          }
          const now = Date.now();
          let updated = false;
          if (last && last.date) {
            const lastTime = new Date(last.date).getTime();
            // if last entry has empty suggestions or was created within 60s, update it
            const emptySuggestions = !last.suggestions || (Array.isArray(last.suggestions) && last.suggestions.length === 0);
            if (emptySuggestions || (now - lastTime) < 60000) {
              await db.updateHistorySuggestions(last.date, collected);
              updated = true;
            }
          }
          if (!updated) {
            await db.saveHistoryEntry(primaryMood, collected);
          }
        } catch (e) {
          try {
            const hist = JSON.parse(localStorage.getItem('moodHistory')||'[]');
            if (hist.length) {
              hist[hist.length-1].suggestions = collected;
              localStorage.setItem('moodHistory', JSON.stringify(hist));
            } else {
              hist.push({ mood: primaryMood, suggestions: collected, date: new Date().toISOString() });
              localStorage.setItem('moodHistory', JSON.stringify(hist));
            }
          } catch (e) {}
        }
        // notify listeners that history changed
        try { window.dispatchEvent(new CustomEvent('historyUpdated')); } catch (e) {}
        // refresh favorites
        try { const f = await db.getFavorites(); setFavoritesList(Array.isArray(f) ? f : []); } catch (e) { setFavoritesList(JSON.parse(localStorage.getItem('favorites') || '[]')); }
      }
    };

    load();
    return () => { mounted = false; };
  }, [location.key]);

  const toggleFavorite = (food) => {
    (async () => {
      const favs = await db.getFavorites().catch(() => JSON.parse(localStorage.getItem('favorites') || '[]'));
      const exists = favs.find((f) => f.name === food.name && f.mood === mood);
      if (exists) {
        setPendingRemove(food);
        setShowRemoveAlert(true);
      } else {
        await db.saveFavorite({ ...food, mood });
        try { const fnew = await db.getFavorites(); setFavoritesList(Array.isArray(fnew) ? fnew : []); } catch (e) { setFavoritesList(JSON.parse(localStorage.getItem('favorites') || '[]')); }
        setToast({ show: true, msg: 'Added to favorites' });
        try { window.dispatchEvent(new CustomEvent('favoritesUpdated')); } catch (e) {}
      }
    })();
  };

  const setFavoritesState = async () => {
    // refresh favorites from DB/localStorage
    try {
      const f = await db.getFavorites();
      setFavoritesList(Array.isArray(f) ? f : []);
    } catch (e) {
      setFavoritesList(JSON.parse(localStorage.getItem('favorites') || '[]'));
    }
  };

  const saveRating = (food, rating) => {
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
    ratings[`${mood}::${food.name}`] = { rating, date: new Date().toISOString() };
    localStorage.setItem('ratings', JSON.stringify(ratings));
    setToast({ show: true, msg: `Saved ${rating} star(s)` });
    // notify other pages
    try { window.dispatchEvent(new CustomEvent('ratingsUpdated', { detail: { mood, name: food.name, rating } })); } catch (e) {}
  };

  const isFavorited = (food) => {
    return favoritesList && favoritesList.find && !!favoritesList.find(f => f.name === food.name && f.mood === mood);
  };

  return (
    <IonPage>
      <TopBar />
      <IonContent className="suggestions-page ion-padding">
        <div className="suggest-hero">
          <h2>Your feeling {mood}</h2>
          {isCustom && (
            <p className="custom-note">Based on your input, here are some foods that might suit your current mood.</p>
          )}
          <IonButton color="medium" onClick={() => { history.push('/mood'); }}>Start Over</IonButton>
        </div>

        {items.map((food, idx) => (
          <IonCard key={idx} className="suggest-card">
            <IonCardContent>
              <IonItem>
                <IonAvatar slot="start">
                  <img src={food.image} alt={food.name} onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/placeholder.svg'; }} style={{width:56, height:56, objectFit:'cover', borderRadius:6}} />
                </IonAvatar>
                <div className="suggest-info">
                  <h3>{food.name}</h3>
                  <p>{food.reason || food.message || ''}</p>
                  <div className="actions">
                    <div className="stars">
                      {[1,2,3,4,5].map((s) => (
                        <button key={s} className="star-btn" onClick={() => saveRating(food, s)}>{s <= (JSON.parse(localStorage.getItem('ratings')||'{}')[`${mood}::${food.name}`]?.rating || 0) ? '★' : '☆'}</button>
                      ))}
                    </div>
                    <IonButton fill="clear" onClick={() => toggleFavorite(food)}>
                      <IonIcon icon={isFavorited(food) ? heart : heartOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonItem>
            </IonCardContent>
          </IonCard>
        ))}

        <IonToast isOpen={toast.show} message={toast.msg} duration={1200} onDidDismiss={() => setToast({ show: false, msg: '' })} />
        <IonAlert
          isOpen={showRemoveAlert}
          header={'Remove favorite'}
          message={pendingRemove ? `Remove ${pendingRemove.name} from favorites?` : ''}
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => { setShowRemoveAlert(false); setPendingRemove(null); } },
            { text: 'Remove', role: 'destructive', handler: async () => {
                try {
                  await db.deleteFavorite(pendingRemove.name, mood);
                } catch (e) {
                  const favs2 = JSON.parse(localStorage.getItem('favorites') || '[]');
                  const filtered = favs2.filter((f) => !(f.name === pendingRemove.name && f.mood === mood));
                  localStorage.setItem('favorites', JSON.stringify(filtered));
                }
                await setFavoritesState();
                try { window.dispatchEvent(new CustomEvent('favoritesUpdated')); } catch (e) {}
                setToast({ show: true, msg: 'Removed from favorites' });
                setShowRemoveAlert(false);
                setPendingRemove(null);
            }}
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Suggestions;
