import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react';
import { useAuth } from '../hooks/useAuth';
import { draftService, type EncoderDraftSummary } from '../services/draftService';
import EncoderSidebar from '../components/EncoderSidebar';
import './EncoderPortal.css';

type DraftTab = 'drafts' | 'submitted' | 'activity';

const EncoderClientsPage: React.FC = () => {
  const history = useHistory();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<DraftTab>('drafts');
  const [drafts, setDrafts] = useState<EncoderDraftSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    []
  );

  const refreshDrafts = () => {
    if (!profile) {
      setDrafts([]);
      return;
    }
    setDrafts(draftService.listDraftSummaries(profile.id));
  };

  // Runs every time the user navigates to this page (Ionic keeps pages alive)
  useIonViewWillEnter(() => {
    refreshDrafts();
  });

  const filteredDrafts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter((d) => d.clientName.toLowerCase().includes(q));
  }, [drafts, searchQuery]);

  const handleResume = (draftId: string) => {
    history.push(`/encoder/register?draft=${encodeURIComponent(draftId)}`);
  };

  const handleDelete = (draftId: string) => {
    if (!profile) return;
    draftService.deleteDraft(profile.id, draftId);
    refreshDrafts();
  };

  const storageUsagePercent = draftService.getStorageUsagePercent();

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div className="ep-page">

          {/* ── Sidebar ── */}
          <EncoderSidebar active="clients" />

          {/* ── Main ── */}
          <main className="ep-main" style={{ overflowY: 'auto', height: '100vh' }}>

            <div className="ep-clients-wrap">

              {/* Sub-navigation Tabs */}
              <div className="ep-clients-tabs">
                <button
                  className={`ep-clients-tab${activeTab === 'drafts' ? ' active' : ''}`}
                  onClick={() => setActiveTab('drafts')}
                >
                  <span className="msym">keyboard</span>
                  Drafts
                </button>
                <button
                  className={`ep-clients-tab${activeTab === 'submitted' ? ' active' : ''}`}
                  onClick={() => setActiveTab('submitted')}
                >
                  <span className="msym">shield_person</span>
                  Submitted
                </button>
                <button
                  className={`ep-clients-tab${activeTab === 'activity' ? ' active' : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  <span className="msym">history</span>
                  Activity Log
                </button>
              </div>

              {/* Page Header */}
              <div className="ep-clients-page-header">
                <div>
                  <h1>Continue Draft</h1>
                  <p>Pick up where you left off. These registrations are saved locally and have not been submitted yet.</p>
                </div>
                <button className="ep-btn-next" onClick={() => history.push('/encoder/register')}>
                  <span className="msym" style={{ fontSize: 18 }}>add</span>
                  New Registration
                </button>
              </div>

              {/* Drafts Table */}
              {activeTab === 'drafts' && (
                <div className="ep-drafts-table-card">
                  {/* Search Bar */}
                  <div className="ep-drafts-search-bar">
                    <span className="msym ep-drafts-search-icon">search</span>
                    <input
                      className="ep-drafts-search-input"
                      type="text"
                      placeholder="Search drafts by client name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="ep-drafts-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                        <span className="msym">close</span>
                      </button>
                    )}
                  </div>
                  <div className="ep-drafts-scroll">
                    <table className="ep-drafts-tbl">
                      <thead>
                        <tr>
                          <th>Client Name</th>
                          <th>Date Started</th>
                          <th>Last Step Completed</th>
                          <th>Progress</th>
                          <th className="ep-th-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDrafts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="ep-td-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                              {searchQuery ? 'No drafts match your search.' : 'No saved drafts yet.'}
                            </td>
                          </tr>
                        ) : (
                          filteredDrafts.map((draft) => (
                            <tr key={draft.id}>
                              <td>
                                <strong className={draft.clientName === 'Unnamed Client' ? 'ep-unnamed' : ''}>{draft.clientName}</strong>
                              </td>
                              <td className="ep-td-muted">{dateFormatter.format(new Date(draft.createdAt))}</td>
                              <td><span className="ep-step-badge">{draft.lastStepLabel}</span></td>
                              <td>
                                <div className="ep-progress-cell">
                                  <div className="ep-progress-bar">
                                    <div className="ep-progress-fill" style={{ width: `${draft.progressPercent}%` }} />
                                  </div>
                                  <span>{draft.progressPercent}%</span>
                                </div>
                              </td>
                              <td className="ep-td-right">
                                <div className="ep-actions-cell">
                                  <button className="ep-btn-resume" onClick={() => handleResume(draft.id)}>
                                    <span className="msym">play_arrow</span> Resume
                                  </button>
                                  <button className="ep-btn-delete" aria-label="Delete" onClick={() => handleDelete(draft.id)}>
                                    <span className="msym">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="ep-drafts-tbl-footer">
                    <span>Showing {filteredDrafts.length}{searchQuery ? ` of ${drafts.length}` : ''} active draft{filteredDrafts.length === 1 ? '' : 's'}</span>
                    <div className="ep-tbl-pagination">
                      <button disabled><span className="msym" style={{ fontSize: 16 }}>chevron_left</span></button>
                      <button className="ep-page-active">1</button>
                      <button disabled><span className="msym" style={{ fontSize: 16 }}>chevron_right</span></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submitted tab placeholder */}
              {activeTab === 'submitted' && (
                <div className="ep-drafts-table-card ep-tab-empty">
                  <span className="msym" style={{ fontSize: 40, color: '#c2c6d4' }}>shield_person</span>
                  <p>No submitted registrations yet.</p>
                </div>
              )}

              {/* Activity Log tab placeholder */}
              {activeTab === 'activity' && (
                <div className="ep-drafts-table-card ep-tab-empty">
                  <span className="msym" style={{ fontSize: 40, color: '#c2c6d4' }}>history</span>
                  <p>No activity recorded yet.</p>
                </div>
              )}

              {/* Bento Section */}
              <div className="ep-clients-bento">
                <div className="ep-bento-sync">
                  <div>
                    <span className="ep-bento-eyebrow">System Status</span>
                    <h2>Local Storage Sync</h2>
                    <p>Your drafts are currently saved to this browser. Complete them before clearing your cache to ensure no data is lost.</p>
                  </div>
                  <div className="ep-bento-stats">
                    <div className="ep-bento-stat">
                      <span>{drafts.length}</span>
                      <small>Pending Drafts</small>
                    </div>
                    <div className="ep-bento-stat">
                      <span>{storageUsagePercent}%</span>
                      <small>Storage Capacity</small>
                    </div>
                  </div>
                  <div className="ep-bento-blob" />
                </div>
                <div className="ep-bento-tip">
                  <div>
                    <div className="ep-bento-tip-icon">
                      <span className="msym">tips_and_updates</span>
                    </div>
                    <h3>Pro Tip</h3>
                    <p>You can resume any registration from the same device within 30 days of the last update.</p>
                  </div>
                  <button className="ep-bento-link">
                    Read Encoder Manual
                    <span className="msym" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              </div>

            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EncoderClientsPage;
