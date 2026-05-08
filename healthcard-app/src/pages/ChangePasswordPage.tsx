import { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { IonContent, IonIcon, IonPage, IonSpinner, IonText } from '@ionic/react';
import { arrowForwardOutline, eyeOffOutline, eyeOutline, lockClosedOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { supabaseAuthService } from '../services/supabaseAuthService';
import './Portal.css';

const ChangePasswordPage: React.FC = () => {
  const { session, profile, refreshProfile } = useAuth();
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!session) {
    return <Redirect to="/login" />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      await supabaseAuthService.updatePassword(password);
      await refreshProfile();
      setMessage('Password updated successfully. Redirecting to your portal...');
      setTimeout(() => {
        history.replace('/');
      }, 1000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="portal-bg hospital-light login-screen">
          <div className="login-center-wrap">
            <section className="login-shell">

              {/* Left hero panel */}
              <div className="login-hero" aria-hidden="true">
                <div className="login-hero-overlay" />
                <div className="login-hero-content">
                  <div className="hero-brand">
                    <img src="/NewPalayanCityLogo.png" alt="Palayan City Seal" className="hero-brand-logo" />
                    <div className="hero-brand-text">
                      <strong>Palayan City</strong>
                      <span>Health Card System</span>
                    </div>
                  </div>
                  <h2>
                    <span className="hero-line-nowrap">Secure your account</span>
                    <br />
                    <span className="hero-line-nowrap">before you continue.</span>
                  </h2>
                  <p>
                    For your security, please set a new password. Choose something strong that only you know.
                  </p>
                </div>
              </div>

              {/* Right form panel */}
              <div className="login-panel-wrap">
                <div className="login-panel">
                  <div className="login-panel-header">
                    <h1>Set New Password</h1>
                    <p>
                      {profile?.must_change_password
                        ? 'A temporary password was detected. Please set a new password before continuing.'
                        : 'Update your password to keep your account secure.'}
                    </p>
                  </div>

                  <div className="login-form-card">
                    <form className="login-form" onSubmit={submit}>
                      <label className="field-label">
                        New Password
                        <span className="field-shell">
                          <IonIcon icon={lockClosedOutline} />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={8}
                            placeholder="At least 8 characters"
                            required
                          />
                          <button
                            type="button"
                            className="password-visibility"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                          </button>
                        </span>
                      </label>

                      <label className="field-label">
                        Confirm New Password
                        <span className="field-shell">
                          <IonIcon icon={lockClosedOutline} />
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            minLength={8}
                            placeholder="Re-enter new password"
                            required
                          />
                          <button
                            type="button"
                            className="password-visibility"
                            onClick={() => setShowConfirm((v) => !v)}
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                          >
                            <IonIcon icon={showConfirm ? eyeOffOutline : eyeOutline} />
                          </button>
                        </span>
                      </label>

                      <button className="primary-signin" type="submit" disabled={loading}>
                        {loading ? (
                          <IonSpinner name="crescent" />
                        ) : (
                          <>
                            Update Password
                            <IonIcon icon={arrowForwardOutline} />
                          </>
                        )}
                      </button>
                    </form>

                    {(error || message) && (
                      <div className="login-messages">
                        {error && (
                          <IonText color="danger">
                            <p className="error-text">{error}</p>
                          </IonText>
                        )}
                        {message && (
                          <IonText color="success">
                            <p className="success-text">{message}</p>
                          </IonText>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="login-footer">
                    <p>© 2026 Palayan City Healthcare Systems. All Rights Reserved.</p>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChangePasswordPage;
