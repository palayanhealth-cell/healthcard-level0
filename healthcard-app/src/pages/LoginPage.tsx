import { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { IonContent, IonIcon, IonPage, IonSpinner, IonText } from '@ionic/react';
import {
  arrowForwardOutline,
  atOutline,
  eyeOffOutline,
  eyeOutline,
  informationCircleOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { supabaseAuthService, AuthenticationError } from '../services/supabaseAuthService';
import './Portal.css';

type LoginRole = 'client' | 'encoder' | 'admin';

const LoginPage: React.FC = () => {
  const { profile } = useAuth();
  const [role, setRole] = useState<LoginRole>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (profile) {
    return <Redirect to="/" />;
  }

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await supabaseAuthService.login(identifier, password, role);
    } catch (caught) {
      let errorMessage: string;
      
      if (caught instanceof AuthenticationError) {
        errorMessage = caught.message;
      } else if (caught instanceof Error) {
        // Handle generic auth errors
        if (caught.message?.includes('Invalid login credentials')) {
          errorMessage = 'Incorrect email/username or password. Please try again.';
        } else if (caught.message?.includes('network')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (caught.message?.includes('firebase')) {
          errorMessage = 'Service configuration error. Please contact support.';
        } else {
          errorMessage = caught.message;
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      console.error('Login error:', caught);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    setError(null);
    setMessage(null);
    setResetLoading(true);
    try {
      await supabaseAuthService.requestPasswordReset(identifier);
      setMessage('Password reset email sent successfully. Please check your inbox (and spam folder) and follow the link.');
    } catch (caught) {
      const nextError = caught instanceof Error ? caught.message : 'Failed to send password reset email.';
      setError(nextError);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="portal-bg hospital-light login-screen">
          <div className="login-center-wrap">
            <section className="login-shell">
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
                    <span className="hero-line-nowrap">Digital health services</span>
                    <br />
                    <span className="hero-line-nowrap">for a healthier community.</span>
                  </h2>
                  <p>
                    Access your medical records, appointments, and essential services with Palayan&apos;s official
                    health portal.
                  </p>
                </div>
              </div>

              <div className="login-panel-wrap">
                <div className="login-panel">
                  <div className="login-panel-header">
                    <h1>Welcome Back</h1>
                    <p>Please sign in to access your dashboard</p>
                  </div>

                  <p className="role-label">Select Portal Role</p>
                  <div className="role-switcher" role="tablist" aria-label="Portal role selector">
                    {(['client', 'encoder', 'admin'] as LoginRole[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={role === option ? 'role-chip active' : 'role-chip'}
                        onClick={() => setRole(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="login-form-card">
                    <form className="login-form" onSubmit={submitLogin}>
                      <label className="field-label">
                        Email or Username
                        <span className="field-shell">
                          <IonIcon icon={atOutline} />
                          <input
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            placeholder="Enter your registered email"
                            required
                          />
                        </span>
                      </label>

                      <div className="field-topline">
                        <span className="field-label-text">Password</span>
                        <button
                          type="button"
                          className="forgot-link"
                          disabled={resetLoading || !identifier.trim()}
                          onClick={sendReset}
                        >
                          {resetLoading ? 'Sending...' : 'Forgot Password?'}
                        </button>
                      </div>

                      <label className="field-label no-gap">
                        <span className="field-shell">
                          <IonIcon icon={lockClosedOutline} />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={8}
                            placeholder="Enter your security password"
                            required
                          />
                          <button
                            type="button"
                            className="password-visibility"
                            onClick={() => setShowPassword((current) => !current)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                          </button>
                        </span>
                      </label>

                      <label className="remember-row">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                        />
                        <span>Keep me signed in</span>
                      </label>

                      <button className="primary-signin" type="submit" disabled={loading}>
                        {loading ? (
                          <IonSpinner name="crescent" />
                        ) : (
                          <>
                            Sign In
                            <IonIcon icon={arrowForwardOutline} />
                          </>
                        )}
                      </button>
                    </form>

                    {(error || message || !true) && (
                      <div className="login-messages">
                        {error && (
                          <IonText color="danger">
                            <p className="error-text" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{error}</p>
                          </IonText>
                        )}
                        {message && (
                          <IonText color="success">
                            <p className="success-text">{message}</p>
                          </IonText>
                        )}
                      </div>
                    )}

                    <div className="login-footer-divider" />
                    <div className="login-help-row">
                      <p>Need assistance with your account?</p>
                      <button type="button" className="help-center-btn">
                        <IonIcon icon={informationCircleOutline} />
                        Help Center
                      </button>
                    </div>
                    <p className="login-copyright">© 2026 Palayan City Healthcare Systems. All Rights Reserved.</p>
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

export default LoginPage;
