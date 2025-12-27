import { IonPage, IonContent } from '@ionic/react';
import './AboutUs.css';
import TopBar from '../components/TopBar.jsx';

const team = [
  { name: 'Joeshua Jhowne Del Rosario', image: '/assets/images/delrosario.jpg' },
  { name: 'Catherine Ramos', image: '/assets/images/ramos.jpg' },
  { name: 'Edralyn Gardanozo', image: '/assets/images/gardanozo.jpeg' },
  { name: 'Lorelyn Marie Rufino', image: '/assets/images/rufino.jpg' },
  { name: 'John Lloyd Pacanas', image: '/assets/images/pacanas.jpg' },
  { name: 'Edren Canlas', image: '/assets/images/canlas.jfif' }
];

const AboutUs = () => {
  return (
    <IonPage>
      <TopBar />
      <IonContent>
        <div className="about-page">
          <div className="about-hero">
            <div className="logo"><img src="/assets/images/CraveMate.png" alt="CraveMate" style={{height:136}}/></div>
            <div className="about-title">About us</div>
          </div>
          <div className="about-card">
            <p style={{textAlign:'center',lineHeight:1.6}}>CraveMate is an intelligent mood-based food suggestion app that helps users discover what food might best satisfy their cravings depending on how they feel.</p>
            <div style={{textAlign:'center',marginTop:10}}>Developers</div>
          </div>

          <div className="team-grid">
            {team.map((member, i) => (
              <div key={i} className="team-item">
                <div className="team-avatar"><img src={member.image || '/assets/images/placeholder.svg'} alt={member.name} style={{width:64,height:64,borderRadius:8,objectFit:'cover'}}/></div>
                <div style={{fontWeight:700,fontSize:14}}>{member.name.split(' ')[0]}</div>
                <div className="muted small">Researcher</div>
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AboutUs;
