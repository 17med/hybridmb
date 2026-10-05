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

// Appwrite's own minimum; checking it here gives a faster, clearer error.
const MIN_PASSWORD_LENGTH = 8;

const Register: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      // Fails closed: the account or session was not created; the user sees why and can retry.
      setError(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>HypbridChat — Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonInput
            label="Display name"
            labelPlacement="stacked"
            maxlength={64}
            value={name}
            onIonInput={(e) => setName(e.detail.value ?? '')}
            required
          />
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
            autocomplete="new-password"
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
            Create account
          </IonButton>
        </form>
        <IonButton expand="block" fill="clear" routerLink="/login">
          Already registered? Log in
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Register;
