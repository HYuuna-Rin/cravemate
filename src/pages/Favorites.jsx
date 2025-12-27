import { IonPage, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon } from '@ionic/react';
import { trash } from 'ionicons/icons';
import './Favorites.css';
import { useState, useEffect } from 'react';
import './History.css';
import db from '../services/db';
import TopBar from '../components/TopBar.jsx';

const Favorites = () => {
  const [favs, setFavs] = useState([]);
  const [ratings, setRatings] = useState({});

  const load = async () => {
    try {
      const f = await db.getFavorites();
      setFavs(Array.isArray(f) ? f : []);
    } catch (e) {
      setFavs(JSON.parse(localStorage.getItem('favorites') || '[]'));
    }
    setRatings(JSON.parse(localStorage.getItem('ratings') || '{}'));
  };

  useEffect(() => {
    load();
    const onRatings = () => setRatings(JSON.parse(localStorage.getItem('ratings') || '{}'));
    const onFavs = () => load();
    window.addEventListener('ratingsUpdated', onRatings);
    window.addEventListener('favoritesUpdated', onFavs);
    return () => {
      window.removeEventListener('ratingsUpdated', onRatings);
      window.removeEventListener('favoritesUpdated', onFavs);
    };
  }, []);

  const saveRating = (f, r) => {
    const key = `${f.mood}::${f.name}`;
    const rs = JSON.parse(localStorage.getItem('ratings') || '{}');
    rs[key] = { rating: r, date: new Date().toISOString() };
    localStorage.setItem('ratings', JSON.stringify(rs));
    setRatings(rs);
    window.dispatchEvent(new CustomEvent('ratingsUpdated', { detail: { key, rating: r } }));
  };

  const removeFavorite = async (f) => {
    try {
      await db.deleteFavorite(f.name, f.mood);
    } catch (e) {
      const favs2 = JSON.parse(localStorage.getItem('favorites') || '[]');
      const filtered = favs2.filter((x) => !(x.name === f.name && x.mood === f.mood));
      localStorage.setItem('favorites', JSON.stringify(filtered));
    }
    await load();
    try { window.dispatchEvent(new CustomEvent('favoritesUpdated')); } catch (e) {}
  };

  return (
    <IonPage className="favorites-page">
      <TopBar />
      <IonContent className="favorites-content ion-padding">
        <div className="favorites-hero">
          <div className="logo">Favorites</div>
        </div>
        <IonList>
          {favs.length === 0 && <div className="small">No favorites yet.</div>}
          {favs.map((f, i) => (
            <div key={f.id || i} className="favorites-card">
              <IonItem>
                <IonLabel style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <strong>{f.name}</strong>
                      <div className="muted small">{f.mood}</div>
                    </div>
                      <div className="stars-inline">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} className="star-btn" onClick={() => saveRating(f, s)}>{s <= (ratings[`${f.mood}::${f.name}`]?.rating || 0) ? '★' : '☆'}</button>
                        ))}
                      </div>
                      <div style={{marginLeft:12}}>
                        <IonButton fill="clear" color="danger" onClick={() => removeFavorite(f)} aria-label={`Remove ${f.name}`}>
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                  </div>
                </IonLabel>
              </IonItem>
            </div>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Favorites;
