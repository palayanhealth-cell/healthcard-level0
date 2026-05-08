import { Redirect, Route, RouteProps } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminStaffPage from './pages/AdminStaffPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ClientCardPage from './pages/ClientCardPage';
import EncoderClientsPage from './pages/EncoderClientsPage';
import EncoderDashboardPage from './pages/EncoderDashboardPage';
import EncoderFormPage from './pages/EncoderFormPage';
import LoginPage from './pages/LoginPage';
import type { UserRole } from './types/domain';

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
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const LoadingScreen: React.FC = () => (
  <IonPage>
    <IonContent fullscreen className="ion-padding ion-text-center">
      <IonSpinner name="crescent" />
    </IonContent>
  </IonPage>
);

const LandingRoute: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Redirect to="/login" />;
  }

  if (profile.must_change_password) {
    return <Redirect to="/change-password" />;
  }

  if (profile.role === 'admin' || profile.role === 'super_admin') {
    return <Redirect to="/admin" />;
  }

  if (profile.role === 'encoder') {
    return <Redirect to="/encoder" />;
  }

  return <Redirect to="/client" />;
};

interface ProtectedRouteProps extends RouteProps {
  allowedRoles: UserRole[];
  component: React.ComponentType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, component: Component, ...rest }) => {
  const { profile, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={() => {
        if (loading) {
          return <LoadingScreen />;
        }
        if (!profile) {
          return <Redirect to="/login" />;
        }
        if (profile.must_change_password) {
          return <Redirect to="/change-password" />;
        }
        if (!allowedRoles.includes(profile.role)) {
          return <Redirect to="/" />;
        }
        return <Component />;
      }}
    />
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/change-password" component={ChangePasswordPage} />
          <ProtectedRoute exact path="/admin" allowedRoles={['super_admin', 'admin']} component={AdminDashboardPage} />
          <ProtectedRoute exact path="/admin/clients" allowedRoles={['super_admin', 'admin']} component={AdminClientsPage} />
          <ProtectedRoute exact path="/admin/staff" allowedRoles={['super_admin', 'admin']} component={AdminStaffPage} />
          <ProtectedRoute exact path="/encoder" allowedRoles={['encoder']} component={EncoderDashboardPage} />
          <ProtectedRoute exact path="/encoder/clients" allowedRoles={['encoder']} component={EncoderClientsPage} />
          <ProtectedRoute exact path="/encoder/register" allowedRoles={['encoder']} component={EncoderFormPage} />
          <ProtectedRoute exact path="/client" allowedRoles={['client']} component={ClientCardPage} />
          <Route exact path="/" component={LandingRoute} />
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
