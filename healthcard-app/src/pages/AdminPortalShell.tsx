import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  addOutline,
  checkmarkDoneOutline,
  chevronBackOutline,
  chevronForwardOutline,
  documentTextOutline,
  downloadOutline,
  helpCircleOutline,
  logOutOutline,
  medicalOutline,
  notificationsOutline,
  peopleOutline,
  personAddOutline,
  receiptOutline,
  searchOutline,
  settingsOutline,
  speedometerOutline,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import type { AccountStatus, StaffRole } from '../types/domain';
import './AdminPortal.css';

type AdminSection = 'dashboard' | 'clients' | 'staff';

interface MetricCard {
  icon: string;
  tint: 'blue' | 'purple' | 'orange' | 'green' | 'rose' | 'mint';
  label: string;
  value: string;
  badge?: string;
}

interface AdminPortalShellProps {
  activeSection: AdminSection;
  searchPlaceholder: string;
  searchWidth?: 'regular' | 'wide';
  headerBrand?: string;
  profileInitials?: string;
  profileName?: string;
  profileRoleLabel?: string;
  children: ReactNode;
}

export interface ActivityItem {
  icon: string;
  tint: 'blue' | 'orange' | 'indigo' | 'slate';
  title: string;
  description: string;
  timestamp: string;
}

export interface StaffRow {
  id: string;
  initials: string;
  name: string;
  email: string;
  username?: string | null;
  role: StaffRole;
  accountStatus: Extract<AccountStatus, 'active' | 'inactive'>;
  mustChangePassword: boolean;
  createdAtLabel: string;
  canEdit: boolean;
  canToggleStatus: boolean;
  canDelete: boolean;
  isProtected: boolean;
}

export interface ClientRow {
  initials: string;
  tint: 'blue' | 'orange' | 'green' | 'slate';
  name: string;
  email: string;
  barangay: string;
  registrationDate: string;
  cardId: string;
  status: 'Active' | 'Pending' | 'Expired';
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: speedometerOutline, to: '/admin' },
  { key: 'clients', label: 'Clients', icon: peopleOutline, to: '/admin/clients' },
  { key: 'staff', label: 'Staff Management', icon: medicalOutline, to: '/admin/staff' },
] as const;

const metricClassMap: Record<MetricCard['tint'], string> = {
  blue: 'metric-icon-blue',
  purple: 'metric-icon-purple',
  orange: 'metric-icon-orange',
  green: 'metric-icon-green',
  rose: 'metric-icon-rose',
  mint: 'metric-icon-mint',
};

const activityToneClassMap: Record<ActivityItem['tint'], string> = {
  blue: 'activity-icon-blue',
  orange: 'activity-icon-orange',
  indigo: 'activity-icon-indigo',
  slate: 'activity-icon-slate',
};

const clientToneClassMap: Record<ClientRow['tint'], string> = {
  blue: 'avatar-chip-blue',
  orange: 'avatar-chip-orange',
  green: 'avatar-chip-green',
  slate: 'avatar-chip-slate',
};

const statusClassMap: Record<ClientRow['status'], string> = {
  Active: 'status-pill-active',
  Pending: 'status-pill-pending',
  Expired: 'status-pill-expired',
};

const toInitials = (value?: string | null) => {
  if (!value) {
    return 'AD';
  }

  const [first = '', second = ''] = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || value.slice(0, 2).toUpperCase();
};

const formatRoleLabel = (role?: string | null) => {
  if (!role) {
    return 'HEALTH OFFICER';
  }

  return role.replace(/_/g, ' ').toUpperCase();
};

const formatStaffRole = (role: StaffRole) => {
  if (role === 'super_admin') {
    return 'Super Admin';
  }

  if (role === 'admin') {
    return 'Admin';
  }

  return 'Encoder';
};

export const AdminTopHeader: React.FC<Pick<AdminPortalShellProps, 'searchPlaceholder' | 'searchWidth' | 'headerBrand' | 'profileInitials' | 'profileName' | 'profileRoleLabel'>> = ({
  searchPlaceholder,
  searchWidth = 'regular',
  headerBrand,
  profileInitials,
  profileName,
  profileRoleLabel,
}) => {
  const { profile } = useAuth();
  const resolvedName = profileName ?? profile?.full_name ?? 'Admin User';
  const resolvedRole = profileRoleLabel ?? formatRoleLabel(profile?.role);
  const resolvedInitials = profileInitials ?? toInitials(resolvedName);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        {headerBrand ? <span className="admin-topbar-brand">{headerBrand}</span> : null}
        <label className={`admin-search ${searchWidth === 'wide' ? 'admin-search-wide' : ''}`}>
          <IonIcon icon={searchOutline} />
          <input type="text" placeholder={searchPlaceholder} />
        </label>
      </div>
      <div className="admin-topbar-right">
        <button type="button" className="admin-icon-button" aria-label="Notifications">
          <IonIcon icon={notificationsOutline} />
          <span className="notification-dot" />
        </button>
        <button type="button" className="admin-icon-button" aria-label="Help">
          <IonIcon icon={helpCircleOutline} />
        </button>
        <div className="admin-user-block">
          <div className="admin-user-meta">
            <p>{resolvedName}</p>
            <span>{resolvedRole}</span>
          </div>
          <div className="admin-avatar admin-avatar-photo">{resolvedInitials}</div>
        </div>
      </div>
    </header>
  );
};

export const AdminSidebar: React.FC<{ activeSection: AdminSection }> = ({ activeSection }) => {
  const { signOut } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-branding">
        <div className="brand-mark">
          <IonIcon icon={medicalOutline} />
        </div>
        <div>
          <h2>Palayan Health</h2>
          <p>Administrative Access</p>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            exact={item.to === '/admin'}
            className={`admin-nav-link ${activeSection === item.key ? 'is-active' : ''}`}
          >
            <IonIcon icon={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="admin-logout" onClick={() => signOut()}>
        <IonIcon icon={logOutOutline} />
        <span>Log Out</span>
      </button>
    </aside>
  );
};

export const AdminPortalShell: React.FC<AdminPortalShellProps> = ({ activeSection, children, ...headerProps }) => (
  <IonPage>
    <IonContent fullscreen className="admin-portal-page">
      <div className="admin-portal-shell">
        <AdminSidebar activeSection={activeSection} />
        <div className="admin-main-frame">
          <AdminTopHeader {...headerProps} />
          <main className="admin-main-content">{children}</main>
        </div>
      </div>
    </IonContent>
  </IonPage>
);

export const AdminPageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description: string;
  actions: ReactNode;
  titleClassName?: string;
}> = ({ eyebrow, title, description, actions, titleClassName }) => (
  <section className="admin-page-header">
    <div>
      {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
      <h1 className={titleClassName}>{title}</h1>
      <p>{description}</p>
    </div>
    <div className="page-actions">{actions}</div>
  </section>
);

export const AdminActionButton: React.FC<{
  icon: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}> = ({ icon, children, variant = 'secondary' }) => (
  <button type="button" className={`admin-action-button ${variant === 'primary' ? 'is-primary' : ''}`}>
    <IonIcon icon={icon} />
    <span>{children}</span>
  </button>
);

export const MetricsGrid: React.FC<{ cards: MetricCard[] }> = ({ cards }) => (
  <section className="metrics-grid">
    {cards.map((card) => (
      <article key={card.label} className="metric-card">
        <div className="metric-head">
          <div className={`metric-icon ${metricClassMap[card.tint]}`}>
            <IonIcon icon={card.icon} />
          </div>
          {card.badge ? <span className="metric-badge">{card.badge}</span> : null}
        </div>
        <div>
          <p className="metric-label">{card.label}</p>
          <strong className="metric-value">{card.value}</strong>
        </div>
      </article>
    ))}
  </section>
);

export const RecentActivityPanel: React.FC<{ items: ActivityItem[] }> = ({ items }) => (
  <section className="admin-panel admin-panel-glass">
    <div className="panel-header panel-header-inline">
      <h2>Recent Activity</h2>
      <button type="button" className="panel-link-button">
        View All
      </button>
    </div>
    <div className="activity-list">
      {items.map((item) => (
        <article key={`${item.title}-${item.timestamp}`} className="activity-item">
          <div className={`activity-icon ${activityToneClassMap[item.tint]}`}>
            <IonIcon icon={item.icon} />
          </div>
          <div className="activity-copy">
            <p>{item.title}</p>
            <span>{item.description}</span>
            <small>{item.timestamp}</small>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export const RegistrationTrends: React.FC<{ compact?: boolean; labels: string[]; values: number[]; activeIndex: number; tabs?: string[] }> = ({
  compact = false,
  labels,
  values,
  activeIndex,
  tabs,
}) => {
  const max = Math.max(...values);

  return (
    <section className={`admin-panel ${compact ? 'admin-panel-compact' : ''}`}>
      <div className="panel-header panel-header-stack-mobile">
        <div>
          <h2>Registration Trends</h2>
          {!compact ? <p>Daily growth of civic health registrations</p> : null}
        </div>
        {tabs ? (
          <div className="segmented-tabs">
            {tabs.map((tab, index) => (
              <button key={tab} type="button" className={index === 0 ? 'is-active' : ''}>
                {tab}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className={`trend-chart ${compact ? 'is-compact' : ''}`}>
        <div className="trend-bars">
          {values.map((value, index) => (
            <div key={`${labels[index]}-${value}`} className={`trend-bar ${index === activeIndex ? 'is-active' : ''}`} style={{ height: `${(value / max) * 100}%` }} />
          ))}
        </div>
        <div className="trend-labels">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ClientTable: React.FC<{ rows: ClientRow[] }> = ({ rows }) => (
  <section className="admin-panel table-panel">
    <div className="table-toolbar">
      <div className="table-filters">
        <span>Filter by:</span>
        <select defaultValue="All Barangays">
          <option>All Barangays</option>
          <option>Atate</option>
          <option>Maligaya</option>
          <option>Marcos Village</option>
          <option>Palayan City Hall</option>
        </select>
        <select defaultValue="All Status">
          <option>All Status</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Expired</option>
        </select>
      </div>
      <p>
        Showing <strong>1-10</strong> of 12,482 clients
      </p>
    </div>

    <div className="data-table-wrap">
      <table className="data-table client-table">
        <thead>
          <tr>
            <th>Client Identity</th>
            <th>Barangay</th>
            <th>Registration Date</th>
            <th>Health Card ID</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cardId}>
              <td>
                <div className="identity-cell">
                  <div className={`avatar-chip ${clientToneClassMap[row.tint]}`}>{row.initials}</div>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.email}</span>
                  </div>
                </div>
              </td>
              <td>{row.barangay}</td>
              <td>{row.registrationDate}</td>
              <td className="card-id-cell">{row.cardId}</td>
              <td>
                <span className={`status-pill ${statusClassMap[row.status]}`}>{row.status}</span>
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" className="row-icon-button" aria-label={`View ${row.name}`}>
                    <IonIcon icon={searchOutline} />
                  </button>
                  <button type="button" className="row-icon-button" aria-label={`Edit ${row.name}`}>
                    <IonIcon icon={documentTextOutline} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="table-pagination">
      <button type="button">Previous</button>
      <div className="pagination-numbers">
        <button type="button" className="is-active">
          1
        </button>
        <button type="button">2</button>
        <button type="button">3</button>
        <span>...</span>
        <button type="button">12</button>
      </div>
      <button type="button">Next</button>
    </div>
  </section>
);

export const ValidationCard: React.FC = () => (
  <section className="validation-card">
    <h3>Health Card Validation</h3>
    <p>Need to verify a card instantly? Use the portal&apos;s direct scanner or input the ID number.</p>
    <button type="button">
      <IonIcon icon={checkmarkDoneOutline} />
      <span>Launch Scanner</span>
    </button>
  </section>
);

export const StaffTabs: React.FC = () => (
  <div className="staff-tabs">
    <button type="button" className="is-active">
      <IonIcon icon={medicalOutline} />
      <span>Accounts</span>
    </button>
    <button type="button">
      <IonIcon icon={peopleOutline} />
      <span>Roles</span>
    </button>
    <button type="button">
      <IonIcon icon={receiptOutline} />
      <span>Access Rules</span>
    </button>
  </div>
);

export const StaffTable: React.FC<{
  rows: StaffRow[];
  busyId?: string | null;
  onEdit: (row: StaffRow) => void;
  onToggleStatus: (row: StaffRow) => void;
  onDelete: (row: StaffRow) => void;
}> = ({ rows, busyId, onEdit, onToggleStatus, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element) || !target.closest('.staff-menu-shell')) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    const handleViewportChange = () => {
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, []);

  const handleAction = (action: () => void) => {
    setOpenMenuId(null);
    setMenuPosition(null);
    action();
  };

  const toggleMenu = (rowId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (openMenuId === rowId) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 152;
    const viewportPadding = 12;
    const left = Math.min(Math.max(rect.right - menuWidth, viewportPadding), window.innerWidth - menuWidth - viewportPadding);

    setMenuPosition({
      top: rect.bottom + 6,
      left,
    });
    setOpenMenuId(rowId);
  };

  return (
    <section className="admin-panel table-panel staff-table-panel">
      <div className="data-table-wrap">
        <table className="data-table staff-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOpen = openMenuId === row.id;
              const isBusy = busyId === row.id;

              return (
                <tr key={row.id}>
                  <td>
                    <div className="identity-cell">
                      <div className={`avatar-chip ${row.role === 'super_admin' ? 'avatar-chip-blue' : row.role === 'admin' ? 'avatar-chip-green' : 'avatar-chip-slate'}`}>{row.initials}</div>
                      <div>
                        <strong>{row.name}</strong>
                        <span>{row.email}</span>
                        {row.username ? <span className="staff-meta-note">@{row.username}</span> : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="role-badges">
                      <span>{formatStaffRole(row.role)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="staff-status-cell">
                      <span className={`presence-indicator ${row.accountStatus === 'active' ? 'is-online' : 'is-offline'}`}>
                        {row.accountStatus === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      {row.mustChangePassword ? <span className="staff-meta-note">Needs password change</span> : null}
                    </div>
                  </td>
                  <td>{row.createdAtLabel}</td>
                  <td>
                    <div className="staff-menu-shell">
                      <button
                        type="button"
                        className="row-icon-button"
                        aria-label={`More actions for ${row.name}`}
                        aria-expanded={isOpen}
                        onClick={(event) => toggleMenu(row.id, event)}
                      >
                        <span className="ellipsis-icon">⋮</span>
                      </button>
                      {isOpen ? (
                        <div className="staff-action-menu is-floating" role="menu" aria-label={`Actions for ${row.name}`} style={menuPosition ?? undefined}>
                          <button type="button" className="staff-action-button" role="menuitem" onClick={() => handleAction(() => onEdit(row))} disabled={!row.canEdit || isBusy}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="staff-action-button"
                            role="menuitem"
                            onClick={() => handleAction(() => onToggleStatus(row))}
                            disabled={!row.canToggleStatus || isBusy}
                          >
                            {row.accountStatus === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                          <button
                            type="button"
                            className="staff-action-button is-danger"
                            role="menuitem"
                            onClick={() => handleAction(() => onDelete(row))}
                            disabled={!row.canDelete || isBusy}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="staff-table-footer">
        <p>Showing {rows.length} staff account{rows.length === 1 ? '' : 's'}</p>
        <div className="pager-controls pager-static-note">
          <span>Live data</span>
        </div>
      </div>
    </section>
  );
};

export const ShiftDistributionCard: React.FC = () => (
  <section className="shift-card">
    <h3>Shift Distribution</h3>
    <div className="shift-row">
      <div>
        <span>Morning Shift (8AM - 4PM)</span>
        <div className="shift-progress">
          <div className="shift-progress-fill" style={{ width: '78%' }} />
        </div>
      </div>
      <strong>45 staff</strong>
    </div>
    <div className="shift-row">
      <div>
        <span>Evening Shift (4PM - 12AM)</span>
        <div className="shift-progress">
          <div className="shift-progress-fill is-secondary" style={{ width: '46%' }} />
        </div>
      </div>
      <strong>22 staff</strong>
    </div>
    <button type="button">View Full Schedule</button>
  </section>
);

export const PersonnelActionsCard: React.FC = () => (
  <section className="admin-panel personnel-actions-card">
    <h3>Recent Personnel Actions</h3>
    <div className="personnel-action-list">
      <article>
        <div className="personnel-action-icon action-blue">
          <IonIcon icon={personAddOutline} />
        </div>
        <div>
          <strong>New Encoder added</strong>
          <span>Administrator registered Ricardo Gomez</span>
          <small>10 minutes ago</small>
        </div>
      </article>
      <article>
        <div className="personnel-action-icon action-orange">
          <IonIcon icon={documentTextOutline} />
        </div>
        <div>
          <strong>Permissions updated</strong>
          <span>Maria Santos promoted to Senior Encoder</span>
          <small>1 hour ago</small>
        </div>
      </article>
      <article>
        <div className="personnel-action-icon action-rose">
          <IonIcon icon={logOutOutline} />
        </div>
        <div>
          <strong>Account Suspended</strong>
          <span>Encoder D. Lim suspended for inactivity</span>
          <small>Yesterday</small>
        </div>
      </article>
    </div>
  </section>
);

export const DashboardAlertCard: React.FC = () => (
  <section className="dashboard-alert-card">
    <h3>System Alert</h3>
    <p>You have 12 pending staff credential verifications requiring immediate attention before the audit.</p>
    <button type="button">Action Needed</button>
    <div className="alert-watermark">△</div>
  </section>
);

export const QuickActionsCard: React.FC = () => (
  <section className="admin-panel quick-actions-card">
    <h3>Quick Actions</h3>
    <div className="quick-actions-grid">
      <button type="button">
        <IonIcon icon={medicalOutline} />
        <span>Issue Card</span>
      </button>
      <button type="button">
        <IonIcon icon={receiptOutline} />
        <span>Audit Logs</span>
      </button>
      <button type="button">
        <IonIcon icon={documentTextOutline} />
        <span>Reports</span>
      </button>
      <button type="button">
        <IonIcon icon={settingsOutline} />
        <span>Settings</span>
      </button>
    </div>
  </section>
);

export const InfrastructureCard: React.FC = () => (
  <section className="infrastructure-card">
    <div className="infrastructure-overlay">
      <span>Infrastructure</span>
      <strong>City Health Expansion Phase 2</strong>
    </div>
  </section>
);

export const exportIcon = downloadOutline;
export const plusIcon = addOutline;