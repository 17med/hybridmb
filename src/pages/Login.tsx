import { IonButton, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonPage, IonSpinner } from '@ionic/react';
import { chatbubbles } from 'ionicons/icons';
import { FormEvent, useState } from 'react';
import { describeAuthError, useAuth } from '../auth/AuthContext';
import './Auth.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      // Fails closed: no session is created, the user sees why and can retry.
      setError(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <IonPage>
      <IonContent className="auth-content" fullscreen>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-logo">
              <IonIcon icon={chatbubbles} />
            </div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to join the HypbridChat room</p>
            <form onSubmit={handleSubmit}>
              <IonInput
                className="auth-input"
                fill="outline"
                label="Email"
                labelPlacement="floating"
                type="email"
                autocomplete="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value ?? '')}
                required
              />
              <IonInput
                className="auth-input"
                fill="outline"
                label="Password"
                labelPlacement="floating"
                type="password"
                autocomplete="current-password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value ?? '')}
                required
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
              {error && <p className="auth-error">{error}</p>}
              <IonButton className="auth-submit" expand="block" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <IonSpinner name="dots" /> : 'Log in'}
              </IonButton>
            </form>
            <IonButton className="auth-switch" expand="block" fill="clear" routerLink="/register">
              No account yet? Create one
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
