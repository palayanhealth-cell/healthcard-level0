import { useEffect, useState } from 'react';
import {
  AdminActionButton,
  AdminPageHeader,
  AdminPortalShell,
  DashboardAlertCard,
  InfrastructureCard,
  MetricsGrid,
  QuickActionsCard,
  RecentActivityPanel,
  RegistrationTrends,
  exportIcon,
  plusIcon,
} from './AdminPortalShell';
import { checkmarkDoneOutline, documentTextOutline, personAddOutline, receiptOutline } from 'ionicons/icons';
import { adminService, clientService } from '../services/stubServices';

const AdminDashboardPage: React.FC = () => {
  const [totalCards, setTotalCards] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clients, staff] = await Promise.all([
          clientService.listClients(),
          adminService.listStaff(),
        ]);
        setTotalCards(clients.length);
        setTotalStaff(staff.length);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    void loadMetrics();
  }, []);

  const dashboardMetrics = [
    { icon: personAddOutline, tint: 'blue', label: 'Total Registrations', value: totalCards.toLocaleString() },
    { icon: receiptOutline, tint: 'purple', label: 'Active Health Cards', value: totalCards.toLocaleString() },
    { icon: documentTextOutline, tint: 'orange', label: 'Pending Approvals', value: '0' },
    { icon: checkmarkDoneOutline, tint: 'green', label: 'Active Staff', value: totalStaff.toLocaleString() },
  ] as const;

  const activityItems = [
    {
      icon: checkmarkDoneOutline,
      tint: 'indigo',
      title: 'System Ready',
      description: `There are ${totalCards} health cards registered in the system.`,
      timestamp: 'Now',
    },
    {
      icon: documentTextOutline,
      tint: 'indigo',
      title: 'Active Staff',
      description: `${totalStaff} staff members are registered in the system.`,
      timestamp: 'Now',
    },
  ] as const;

  return (
    <AdminPortalShell activeSection="dashboard" searchPlaceholder="Search records..." headerBrand="HealthAdmin Portal">
      <AdminPageHeader
        eyebrow="OVERVIEW"
        title="Administrative Dashboard"
        description="Welcome back. Here is what is happening with Palayan health services today."
        actions={
          <>
            <AdminActionButton icon={exportIcon}>Export Data</AdminActionButton>
            <AdminActionButton icon={plusIcon} variant="primary">
              New Registration
            </AdminActionButton>
          </>
        }
      />

      {loading && <p>Loading metrics...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <MetricsGrid cards={[...dashboardMetrics]} />

          <section className="dashboard-main-grid">
            <RecentActivityPanel items={[...activityItems]} />
            <div className="dashboard-side-stack">
              <DashboardAlertCard />
              <QuickActionsCard />
              <InfrastructureCard />
            </div>
          </section>

          <RegistrationTrends
            labels={['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']}
            values={[0, 0, 0, 0, 0, 0, 0]}
            activeIndex={-1}
            tabs={['Daily', 'Weekly', 'Monthly']}
          />
        </>
      )}
    </AdminPortalShell>
  );
};

export default AdminDashboardPage;
