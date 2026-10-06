import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonContent, IonIcon, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { chatbubbles } from 'ionicons/icons';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ChatRoom from './pages/ChatRoom';
import Login from './pages/Login';
import Register from './pages/Register';

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

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* The loading screen borrows the auth background and logo, so launch flows into Login without a flash. */
import './pages/Auth.css';

setupIonicReact();

/** Shown while the stored session is checked. */
const LoadingScreen: React.FC = () => (
  <IonContent className="auth-content">
    <div className="auth-wrapper auth-loading">
      <div className="auth-logo">
        <IonIcon icon={chatbubbles} />
      </div>
      <IonSpinner name="dots" aria-label="Loading" />
    </div>
  </IonContent>
);

/** Auth guard: logged-out users only reach /login and /register, logged-in users only /chat. */
const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/chat" replace /> : <Register />} />
        <Route path="/chat" element={user ? <ChatRoom user={user} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={user ? '/chat' : '/login'} replace />} />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </IonApp>
);

export default App;
