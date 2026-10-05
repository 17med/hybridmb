import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { FormEvent, useState } from 'react';
import { describeAuthError, useAuth } from '../auth/AuthContext';

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
      <IonHeader>
        <IonToolbar>
          <IonTitle>HypbridChat — Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonInput
            label="Email"
            labelPlacement="stacked"
            type="email"
            autocomplete="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value ?? '')}
            required
          />
          <IonInput
            label="Password"
            labelPlacement="stacked"
            type="password"
            autocomplete="current-password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value ?? '')}
            required
          />
          {error && (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          )}
          <IonButton expand="block" type="submit" disabled={isSubmitting}>
            Log in
          </IonButton>
        </form>
        <IonButton expand="block" fill="clear" routerLink="/register">
          No account yet? Register
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;
