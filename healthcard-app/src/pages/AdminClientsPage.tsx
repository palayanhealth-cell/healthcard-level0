import { useEffect, useState } from 'react';
import { medicalOutline, peopleOutline, warningOutline } from 'ionicons/icons';
import {
  AdminActionButton,
  AdminPageHeader,
  AdminPortalShell,
  ClientTable,
  MetricsGrid,
  RegistrationTrends,
  ValidationCard,
  exportIcon,
  plusIcon,
  type ClientRow,
} from './AdminPortalShell';
import { clientService } from '../services/stubServices';

const AdminClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await clientService.listClients();
        setClients(data as ClientRow[]);
        setTotalCount(data.length);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    void loadClients();
  }, []);

  const clientMetrics = [
    { icon: peopleOutline, tint: 'blue', label: 'Total Registered', value: totalCount.toLocaleString() },
    { icon: medicalOutline, tint: 'orange', label: 'Pending Approvals', value: '0' },
    { icon: medicalOutline, tint: 'mint', label: 'Active Cards', value: totalCount.toLocaleString() },
    { icon: warningOutline, tint: 'rose', label: 'Expiring Soon', value: '0' },
  ] as const;

  return (
    <AdminPortalShell activeSection="clients" searchPlaceholder="Search clients by name, ID, or barangay..." searchWidth="wide">
      <AdminPageHeader
        title="Client Management"
        titleClassName="clients-title"
        description="Manage and monitor health card registrations for Palayan City residents."
        actions={
          <>
            <AdminActionButton icon={exportIcon}>Export List</AdminActionButton>
            <AdminActionButton icon={plusIcon} variant="primary">
              Register New Client
            </AdminActionButton>
          </>
        }
      />

      {loading && <p>Loading clients...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <MetricsGrid cards={[...clientMetrics]} />

          <ClientTable rows={clients} />

          <section className="clients-bottom-grid">
            <RegistrationTrends compact labels={['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']} values={[0, 0, 0, 0, 0, 0, 0]} activeIndex={-1} />
            <ValidationCard />
          </section>
        </>
      )}
    </AdminPortalShell>
  );
};

export default AdminClientsPage;