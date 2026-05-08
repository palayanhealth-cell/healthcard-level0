import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react';
import { useAuth } from '../hooks/useAuth';
import EncoderSidebar from '../components/EncoderSidebar';
import { draftService, type EncoderDraftSummary } from '../services/draftService';
import { encoderDashboardService, type EncoderDashboardStats } from '../services/stubServices';
import './EncoderPortal.css';

const getPctDelta = (current: number, base: number) => {
  if (base === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - base) / base) * 100);
};

const getBarClass = (value: number, max: number) => {
  const pct = value / Math.max(1, max);
  if (pct > 0.75) return 'full';
  if (pct > 0.45) return 'mid';
  return 'dim';
};

const toRelativeUpdate = (dateText: string) => {
  const ms = Date.now() - Date.parse(dateText);
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Modified ${Math.max(1, mins)} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Modified ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Modified Yesterday';
  return `Modified ${days} days ago`;
};

const avatarFromName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? 'U').toUpperCase();
};

const EncoderDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const history = useHistory();
  const [stats, setStats] = useState<EncoderDashboardStats | null>(null);
  const [drafts, setDrafts] = useState<EncoderDraftSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = useMemo(() => {
    const name = profile?.full_name ?? '';
    return name.split(' ')[0] || 'Encoder';
  }, [profile]);

  const chartMax = useMemo(
    () => Math.max(1, ...(stats?.last14Days.map((d) => d.count) ?? [0])),
    [stats],
  );

  const loadDashboard = useCallback(async () => {
    if (!profile) {
      setStats(null);
      setDrafts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [dashboardStats] = await Promise.all([
      encoderDashboardService.getStats(profile.id),
    ]);
    setStats(dashboardStats);
    setDrafts(draftService.listDraftSummaries(profile.id).slice(0, 3));
    setLoading(false);
  }, [profile]);

  useIonViewWillEnter(() => {
    void loadDashboard();
  });

  const goToClients = useCallback(() => {
    history.push('/encoder/clients');
  }, [history]);

  const goToRegister = useCallback(() => {
    history.push('/encoder/register');
  }, [history]);

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div className="ep-page">

          {/* ── Sidebar ── */}
          <EncoderSidebar active="dashboard" />

          {/* ── Main ── */}
          <main className="ep-main" style={{ overflowY: 'auto', height: '100vh' }}>
            <div className="ep-main-inner">

              {/* Header */}
              <div className="ep-page-header">
                <div>
                  <h1>Encoder Dashboard</h1>
                  <p>Welcome back, {firstName}. Here's your registration activity.</p>
                </div>
                <button className="ep-btn-primary" onClick={goToRegister}>
                  <span className="msym">add</span>
                  Start New Registration
                </button>
              </div>

              {/* Stat Cards */}
              <div className="ep-stats-grid">
                <div className="ep-stat-card">
                  <div className="ep-stat-label">Today</div>
                  <div className="ep-stat-value-row">
                    <span className="ep-stat-value">{stats?.todayCount ?? 0}</span>
                    <span className={`ep-stat-badge ${getPctDelta(stats?.todayCount ?? 0, stats?.yesterdayCount ?? 0) >= 0 ? 'green' : 'neutral'}`}>
                      <span className="msym">{getPctDelta(stats?.todayCount ?? 0, stats?.yesterdayCount ?? 0) >= 0 ? 'trending_up' : 'trending_down'}</span>
                      {getPctDelta(stats?.todayCount ?? 0, stats?.yesterdayCount ?? 0) >= 0 ? '+' : ''}{getPctDelta(stats?.todayCount ?? 0, stats?.yesterdayCount ?? 0)}%
                    </span>
                  </div>
                  <div className="ep-stat-sub">vs yesterday</div>
                </div>
                <div className="ep-stat-card">
                  <div className="ep-stat-label">Yesterday</div>
                  <div className="ep-stat-value-row">
                    <span className="ep-stat-value">{stats?.yesterdayCount ?? 0}</span>
                    <span className="ep-stat-badge neutral">Target Met</span>
                  </div>
                  <div className="ep-stat-sub">Completed registrations</div>
                </div>
                <div className="ep-stat-card">
                  <div className="ep-stat-label">This Week</div>
                  <div className="ep-stat-value-row">
                    <span className="ep-stat-value">{stats?.weekCount ?? 0}</span>
                    <span className={`ep-stat-badge ${getPctDelta(stats?.weekCount ?? 0, stats?.lastWeekCount ?? 0) >= 0 ? 'green' : 'neutral'}`}>
                      <span className="msym">{getPctDelta(stats?.weekCount ?? 0, stats?.lastWeekCount ?? 0) >= 0 ? 'trending_up' : 'trending_down'}</span>
                      {getPctDelta(stats?.weekCount ?? 0, stats?.lastWeekCount ?? 0) >= 0 ? '+' : ''}{getPctDelta(stats?.weekCount ?? 0, stats?.lastWeekCount ?? 0)}%
                    </span>
                  </div>
                  <div className="ep-stat-sub">vs last week</div>
                </div>
                <div className="ep-stat-card">
                  <div className="ep-stat-label">This Month</div>
                  <div className="ep-stat-value-row">
                    <span className="ep-stat-value">{stats?.monthCount ?? 0}</span>
                    <span className="ep-stat-badge blue">
                      <span className="msym">task_alt</span>On track
                    </span>
                  </div>
                  <div className="ep-stat-sub">Current calendar month</div>
                </div>
              </div>

              {/* Mid Row: Chart + Quick Actions */}
              <div className="ep-mid-row">
                {/* Chart */}
                <div className="ep-chart-card">
                  <div className="ep-chart-header">
                    <div>
                      <h2>Registration Trends</h2>
                      <p>Activity volume over the last 14 days</p>
                    </div>
                    <div className="ep-chart-legend">
                      <div className="ep-chart-legend-dot" />
                      Registrations
                    </div>
                  </div>
                  <div className="ep-chart-area">
                    {(stats?.last14Days ?? []).map((day) => (
                      <div
                        key={day.isoDate}
                        className={`ep-chart-bar ${getBarClass(day.count, chartMax)}`}
                        style={{ height: `${(day.count / chartMax) * 100}%` }}
                        title={`${day.count} registrations`}
                      />
                    ))}
                  </div>
                  <div className="ep-chart-x">
                    {(stats?.last14Days ?? []).filter((_, idx) => idx % 3 === 0 || idx === 13).map((day) => (
                      <span key={day.isoDate}>{day.label}</span>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="ep-right-col">
                  <div className="ep-quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="ep-quick-actions-list">
                      <button className="ep-qa-btn">
                        <span className="msym">search_check</span>
                        Verify Beneficiary
                      </button>
                      <button className="ep-qa-btn">
                        <span className="msym">assignment_ind</span>
                        Update Member Info
                      </button>
                      <button className="ep-qa-btn">
                        <span className="msym">print</span>
                        Print Temp Card
                      </button>
                    </div>
                  </div>

                  <div className="ep-resources-card">
                    <h3>
                      <span className="msym">help_center</span>
                      Resources
                    </h3>
                    <ul className="ep-resources-list">
                      <li><a href="#">2026 Enrollment Guide</a></li>
                      <li><a href="#">Required Documents List</a></li>
                      <li><a href="#">System Support Chat</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Drafts */}
              <div className="ep-drafts-card">
                <div className="ep-drafts-header">
                  <div>
                    <h2>Current Drafts</h2>
                    <p>Pick up where you left off</p>
                  </div>
                  <button className="ep-view-all-link" onClick={goToClients}>
                    View All Drafts
                    <span className="msym">arrow_forward</span>
                  </button>
                </div>
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Completion Progress</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="ep-td-muted" style={{ textAlign: 'center', padding: '1.2rem' }}>
                          {loading ? 'Loading dashboard data...' : 'No saved drafts yet.'}
                        </td>
                      </tr>
                    ) : drafts.map((draft) => (
                      <tr key={draft.id}>
                        <td>
                          <div className="ep-client-cell">
                            <div className="ep-client-avatar blue">{avatarFromName(draft.clientName)}</div>
                            <div>
                              <div className={`ep-client-name${draft.clientName === 'Unnamed Client' ? ' unnamed' : ''}`}>{draft.clientName}</div>
                              <div className="ep-client-sub">{toRelativeUpdate(draft.updatedAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ep-progress-cell">
                            <div className="ep-progress-bar">
                              <div className="ep-progress-fill" style={{ width: `${draft.progressPercent}%` }} />
                            </div>
                            <span className="ep-progress-pct">{draft.progressPercent}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="ep-btn-resume"
                            onClick={() => history.push(`/encoder/register?draft=${encodeURIComponent(draft.id)}`)}
                          >
                            Resume <span className="msym">play_arrow</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </main>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default EncoderDashboardPage;
