import { IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import './TopBar.css';

const TopBar = () => {
  return (
    <IonHeader>
      <IonToolbar className="topbar">
        <div className="topbar-inner">
          <img
            src="/assets/images/CraveMate.png"
            alt="CraveMate"
            className="topbar-logo"
          />
          <IonTitle className="topbar-title">
            CraveMate
          </IonTitle>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default TopBar;
