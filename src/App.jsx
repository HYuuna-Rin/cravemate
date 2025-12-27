import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, time, heart, informationCircle } from 'ionicons/icons';
import Home from './pages/Home';
import MoodSelect from './pages/MoodSelect';
import Suggestions from './pages/Suggestions';
import History from './pages/History';
import Favorites from './pages/Favorites';
import AboutUs from './pages/AboutUs';
// removed Feedback, Login, Signup, Profile, Logout pages per offline-only flow

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* dark palette intentionally not included to keep app light per mockup */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App = () => {

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
          <Route exact path="/favorites">
            <Favorites />
          </Route>
          <Route exact path="/mood">
            <MoodSelect />
          </Route>
          <Route exact path="/suggestions">
            <Suggestions />
          </Route>
          <Route exact path="/about">
            <AboutUs />
          </Route>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/history">
            <History />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom" className="app-tabbar">
          <IonTabButton tab="home" href="/home">
            <IonIcon aria-hidden="true" icon={home} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="history" href="/history">
            <IonIcon aria-hidden="true" icon={time} />
            <IonLabel>History</IonLabel>
          </IonTabButton>

          <IonTabButton className="center-button" tab="mood" href="/mood">
            <div className="center-circle">🎯</div>
          </IonTabButton>
          <IonTabButton tab="favorites" href="/favorites">
            <IonIcon aria-hidden="true" icon={heart} />
            <IonLabel>Favorites</IonLabel>
          </IonTabButton>
          <IonTabButton tab="about" href="/about">
            <IonIcon aria-hidden="true" icon={informationCircle} />
            <IonLabel>About</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
  );
};

export default App;
