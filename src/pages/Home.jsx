import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const history = useHistory();

  const handleStart = () => {
    // Offline-first: start directly at mood selection
    history.push('/mood');
  };

  return (
    <IonPage className="landing-page">
  <IonContent fullscreen className="landing-content">
    <div className="landing-wrapper">
      <div className="landing-hero">
        <div className="landing-logo">
          <img
            src="/assets/images/CraveMate.png"
            alt="CraveMate"
            style={{ width: 188, height: 88 }}
          />
        </div>

        <div className="logo">CraveMate</div>
        <div className="tag">Your AI Food Craving Companion</div>

        <div className="start-area">
          <IonButton className="start-btn" onClick={handleStart}>
            Start
          </IonButton>
        </div>
      </div>
    </div>
  </IonContent>
</IonPage>

  );
};

export default Home;
