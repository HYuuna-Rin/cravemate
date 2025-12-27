import { IonContent, IonPage, IonList, IonItem, IonLabel, IonCard, IonCardContent, IonButton, IonAlert } from '@ionic/react';
import { useState, useEffect } from 'react';
import './History.css';
import db from '../services/db';
import TopBar from '../components/TopBar.jsx';

const History = () => {
  const [history, setHistory] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [confirm, setConfirm] = useState({ show: false, target: null, all: false });

  const load = async () => {
    try {
      const h = await db.getHistory();
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) {
      setHistory(JSON.parse(localStorage.getItem('moodHistory') || '[]'));
    }
  };

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener('historyUpdated', onUpdate);
    return () => { window.removeEventListener('historyUpdated', onUpdate); };
  }, []);

  const toggleIndex = (i) => setOpenIndex(openIndex === i ? null : i);

  const confirmDelete = (item) => setConfirm({ show: true, target: item, all: false });
  const confirmClear = () => setConfirm({ show: true, target: null, all: true });

  const doDelete = async () => {
    if (confirm.all) {
      await db.clearHistory();
    } else if (confirm.target) {
      const date = confirm.target.date;
      await db.deleteHistoryByDate(date);
    }
    setConfirm({ show: false, target: null, all: false });
    load();
    try { window.dispatchEvent(new CustomEvent('historyUpdated')); } catch (e) {}
  };

  return (
    <IonPage>
      <TopBar />
      <IonContent fullscreen>
        <div className="history-page ion-padding">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h2>History</h2>
            <div>
              <IonButton color="danger" fill="clear" onClick={confirmClear}>Delete all</IonButton>
            </div>
          </div>
          <IonList>
            {history.length === 0 && <div className="muted">No history yet.</div>}
            {history.map((item, index) => (
              <IonCard key={item.date || index} className="history-card">
                <IonCardContent>
                  <div className="history-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{cursor:'pointer'}} onClick={() => toggleIndex(index)}>Mood: <strong>{item.mood}</strong></div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div className="history-date">{new Date(item.date).toLocaleString()}</div>
                      <IonButton color="medium" size="small" onClick={() => confirmDelete(item)}>Remove</IonButton>
                    </div>
                  </div>
                  {openIndex === index && (
                    <div className="history-body">
                      {item.suggestions && item.suggestions.map((food, idx) => (
                        <IonItem key={idx}>
                          <IonLabel>
                            <h3>{food.name}</h3>
                            <p>{food.message || food.reason || ''}</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>

          <IonAlert isOpen={confirm.show} header={confirm.all ? 'Delete all history' : 'Delete entry'} message={confirm.all ? 'Remove all history entries?' : `Remove entry for ${confirm.target ? confirm.target.mood : ''}?`} buttons={[{ text: 'Cancel', role: 'cancel', handler: () => setConfirm({ show: false, target: null, all: false }) }, { text: 'Delete', role: 'destructive', handler: () => doDelete() }]} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default History;
