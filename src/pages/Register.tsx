import { IonButton, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonPage, IonSpinner } from '@ionic/react';
import { chatbubbles } from 'ionicons/icons';
import { FormEvent, useState } from 'react';
import { describeAuthError, useAuth } from '../auth/AuthContext';
import './Auth.css';

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
      <IonContent className="auth-content" fullscreen>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-logo">
              <IonIcon icon={chatbubbles} />
            </div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Pick a name everyone in the room will see</p>
            <form onSubmit={handleSubmit}>
              <IonInput
                className="auth-input"
                fill="outline"
                label="Display name"
                labelPlacement="floating"
                maxlength={64}
                value={name}
                onIonInput={(e) => setName(e.detail.value ?? '')}
                required
              />
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
                autocomplete="new-password"
                helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onIonInput={(e) => setPassword(e.detail.value ?? '')}
                required
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
              {error && <p className="auth-error">{error}</p>}
              <IonButton className="auth-submit" expand="block" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <IonSpinner name="dots" /> : 'Create account'}
              </IonButton>
            </form>
            <IonButton className="auth-switch" expand="block" fill="clear" routerLink="/login">
              Already registered? Log in
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
