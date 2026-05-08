import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabaseAuthService } from '../services/supabaseAuthService';

type ActivePage = 'dashboard' | 'clients';

interface Props {
  active: ActivePage;
}

const EncoderSidebar: React.FC<Props> = ({ active }) => {
  const history = useHistory();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try { await supabaseAuthService.logout(); } finally { setLoggingOut(false); }
  }, []);

  return (
    <nav className="ep-sidebar">
      <div className="ep-sidebar-brand">
        <div className="ep-sidebar-brand-icon">
          <span className="msym">health_and_safety</span>
        </div>
        <div className="ep-sidebar-brand-text">
          <strong>Palayan Health</strong>
          <span>Encoder Portal</span>
        </div>
      </div>

      <div className="ep-sidebar-nav">
        <button
          className={`ep-nav-item${active === 'dashboard' ? ' active' : ''}`}
          onClick={() => history.push('/encoder')}
        >
          <span className="msym">dashboard</span>
          Dashboard
        </button>
        <button
          className={`ep-nav-item${active === 'clients' ? ' active' : ''}`}
          onClick={() => history.push('/encoder/clients')}
        >
          <span className="msym">person_add</span>
          Client Registration
        </button>
      </div>

      <div className="ep-sidebar-bottom">
        <div className="ep-sidebar-divider" />
        <button className="ep-nav-item logout" onClick={handleLogout} disabled={loggingOut}>
          <span className="msym">logout</span>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </nav>
  );
};

export default EncoderSidebar;
