import { useEffect, useMemo, useState } from 'react';
import { peopleOutline, personAddOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AdminPageHeader, AdminPortalShell, MetricsGrid, StaffTable, StaffTabs, type StaffRow } from './AdminPortalShell';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/stubServices';
import type { StaffAccount } from '../types/domain';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

const toInitials = (value: string) => {
  const [first = '', second = ''] = value.trim().split(/\s+/);
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || value.slice(0, 2).toUpperCase();
};

interface CreateStaffFormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: 'admin' | 'encoder';
  adminPassword: string; // Admin must verify with their own password
}

interface EditStaffFormState {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'admin' | 'encoder';
  accountStatus: 'active' | 'inactive';
}

const splitFullName = (value: string) => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const joinFullName = (firstName: string, lastName: string) => `${firstName.trim()} ${lastName.trim()}`.trim();

const emptyCreateForm: CreateStaffFormState = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: 'encoder',
  adminPassword: '',
};

const AdminStaffPage: React.FC = () => {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStaffFormState>(emptyCreateForm);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditStaffFormState | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{name: string; email: string; username: string; role: string} | null>(null);

  const isSuperAdmin = profile?.role === 'super_admin';

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Check if all required fields are filled and valid for the create form
  const isCreateFormValid = useMemo(() => {
    return (
      createForm.firstName.trim().length > 0 &&
      createForm.lastName.trim().length > 0 &&
      createForm.username.trim().length > 0 &&
      createForm.email.trim().length > 0 &&
      isValidEmail(createForm.email) && // Email must be valid format
      createForm.adminPassword.trim().length > 0
    );
  }, [createForm]);

  // Check if all required fields are filled for the edit form
  const isEditFormValid = useMemo(() => {
    if (!editForm) return false;
    return (
      editForm.firstName.trim().length > 0 &&
      editForm.lastName.trim().length > 0 &&
      editForm.username.trim().length > 0
    );
  }, [editForm]);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await adminService.listStaff();
      setStaff(rows);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, []);

  const metrics = useMemo(() => {
    const total = staff.length;
    const activeEncoders = staff.filter((row) => row.role === 'encoder' && row.account_status === 'active').length;
    const activeAdmins = staff.filter((row) => (row.role === 'admin' || row.role === 'super_admin') && row.account_status === 'active').length;

    return [
      { icon: peopleOutline, tint: 'blue', label: 'TOTAL STAFF', value: String(total), badge: `${activeAdmins} admin${activeAdmins === 1 ? '' : 's'}` },
      { icon: personAddOutline, tint: 'blue', label: 'ACTIVE ENCODERS', value: String(activeEncoders), badge: 'Live data' },
      { icon: shieldCheckmarkOutline, tint: 'green', label: 'ACTIVE ADMIN', value: String(activeAdmins), badge: 'Live data' },
    ] as const;
  }, [staff]);

  const staffRows: StaffRow[] = useMemo(
    () =>
      staff.map((row) => {
        const isProtected = row.role === 'super_admin';
        const canEdit = isSuperAdmin ? !isProtected : false;
        const canToggleStatus = isSuperAdmin ? !isProtected : false;
        const canDelete = isSuperAdmin ? !isProtected : false;

        return {
          id: row.id,
          initials: toInitials(row.full_name || row.email),
          name: row.full_name || row.email,
          email: row.email,
          username: row.username,
          role: row.role as StaffRow['role'],
          accountStatus: (row.account_status === 'inactive' ? 'inactive' : 'active') as StaffRow['accountStatus'],
          mustChangePassword: row.must_change_password,
          createdAtLabel: formatDate(row.created_at),
          canEdit,
          canToggleStatus,
          canDelete,
          isProtected,
        };
      }),
    [isSuperAdmin, staff]
  );

  const selectedStaff = staff.find((row) => row.id === editingStaffId) ?? null;

  const resetMessages = () => {
    setError(null);
    setMessage(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError(null); // Clear error when closing modal
    setCreateForm((current) => ({ ...emptyCreateForm, role: current.role }));
  };

  const updateCreateForm = <K extends keyof CreateStaffFormState>(field: K, value: CreateStaffFormState[K]) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
    // Clear error when user starts typing again (especially for password field)
    if (error) {
      setError(null);
    }
  };

  const updateEditForm = <K extends keyof EditStaffFormState>(field: K, value: EditStaffFormState[K]) => {
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const openEditForm = (row: StaffRow) => {
    const source = staff.find((item) => item.id === row.id);
    if (!source) {
      return;
    }

    resetMessages();
    setEditingStaffId(row.id);
    const { firstName, lastName } = splitFullName(source.full_name ?? '');
    setEditForm({
      userId: source.id,
      firstName,
      lastName,
      username: source.username ?? '',
      role: source.role === 'admin' ? 'admin' : 'encoder',
      accountStatus: source.account_status === 'inactive' ? 'inactive' : 'active',
    });
  };

  const closeEditForm = () => {
    setEditingStaffId(null);
    setEditForm(null);
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setSaving(true);

    try {
      const result = await adminService.createStaff({
        username: createForm.username.trim().toLowerCase(),
        email: createForm.email.trim().toLowerCase(),
        full_name: joinFullName(createForm.firstName, createForm.lastName),
        role: createForm.role,
        account_status: 'active',
        must_change_password: true,
      });
      
      // Store created account details for success modal
      setCreatedAccount({
        name: `${createForm.firstName} ${createForm.lastName}`,
        email: createForm.email,
        username: createForm.username,
        role: createForm.role,
      });
      
      setCreateForm({ ...emptyCreateForm, role: isSuperAdmin ? createForm.role : 'encoder' });
      setShowCreateModal(false);
      setShowSuccessModal(true);
      
      // Also set the banner message
      setMessage(`✅ Account created for ${createForm.firstName} ${createForm.lastName}. Temporary password sent to ${createForm.email}`);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Palayan Health Card', {
          body: `Staff account created for ${createForm.firstName} ${createForm.lastName}. Temporary password sent to ${createForm.email}`,
          icon: '/NewPalayanCityLogo.png'
        });
      }
      
      await loadStaff();
    } catch (caught) {
      let errorMsg = caught instanceof Error ? caught.message : 'Failed to create staff account.';
      
      // Handle generic edge function error
      if (errorMsg.includes('Edge Function returned a non-2xx status code')) {
        errorMsg = 'Server error. Please check your admin password and try again.';
      }
      
      // Enhance specific error messages
      if (errorMsg.includes('Admin password verification failed') || 
          errorMsg.includes('403') || 
          errorMsg.includes('Access denied') ||
          errorMsg.includes('check your password')) {
        setError(`❌ Incorrect admin password. Please enter your correct password to create this account.`);
      } else if (errorMsg.includes('already exists')) {
        if (errorMsg.toLowerCase().includes('email')) {
          setError(`❌ This email (${createForm.email}) is already registered. Please use a different email address.`);
        } else if (errorMsg.toLowerCase().includes('username')) {
          setError(`❌ This username (${createForm.username}) is already taken. Please choose a different username.`);
        } else {
          setError(`❌ ${errorMsg}`);
        }
      } else if (errorMsg.includes('fields including admin password are required')) {
        setError(`❌ Please enter your admin password to verify this action.`);
      } else {
        setError(`❌ ${errorMsg}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    resetMessages();
    setSaving(true);
    setBusyId(editForm.userId);

    try {
      await adminService.updateStaff(editForm.userId, {
        username: editForm.username.trim().toLowerCase(),
        full_name: joinFullName(editForm.firstName, editForm.lastName),
        role: editForm.role,
        account_status: editForm.accountStatus,
      });
      setMessage('Staff account updated successfully.');
      closeEditForm();
      await loadStaff();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update staff account.');
    } finally {
      setSaving(false);
      setBusyId(null);
    }
  };

  const toggleStatus = async (row: StaffRow) => {
    resetMessages();
    setBusyId(row.id);

    try {
      await adminService.updateStaff(row.id, {
        username: row.username ?? '',
        full_name: row.name,
        role: row.role === 'admin' ? 'admin' : 'encoder',
        account_status: row.accountStatus === 'active' ? 'inactive' : 'active',
      });
      setMessage(`Account ${row.accountStatus === 'active' ? 'deactivated' : 'reactivated'} successfully.`);
      await loadStaff();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update account status.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteStaff = async (row: StaffRow) => {
    const confirmed = window.confirm(`Delete ${row.name}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    resetMessages();
    setBusyId(row.id);

    try {
      await adminService.deleteStaff(row.id);
      setMessage('Staff account deleted successfully.');
      if (editingStaffId === row.id) {
        closeEditForm();
      }
      await loadStaff();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to delete staff account.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPortalShell activeSection="staff" searchPlaceholder="Search staff records...">
      <div className="staff-page-compact">
        <AdminPageHeader
          title="Staff Management"
          description="Manage super admin, admin, and encoder accounts for Palayan City Health."
          actions={
            <button type="button" className="admin-action-button is-primary" onClick={() => setShowCreateModal(true)}>
              <span className="staff-header-plus">+</span>
              <span>Add New Staff</span>
            </button>
          }
        />

        <MetricsGrid cards={[...metrics]} />
        <StaffTabs />

        {error ? (
          <div className="staff-feedback is-error" style={{ whiteSpace: 'pre-line', padding: '12px 16px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #ef4444', marginBottom: '16px' }}>
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="staff-feedback is-success" style={{ whiteSpace: 'pre-line', padding: '12px 16px', borderRadius: '8px', background: '#dcfce7', border: '1px solid #22c55e', marginBottom: '16px' }}>
            {message}
          </div>
        ) : null}

        <section className="staff-content-grid">
          {loading ? (
            <section className="admin-panel staff-empty-state">
              <h3>Loading staff accounts...</h3>
            </section>
          ) : (
            <StaffTable rows={staffRows} busyId={busyId} onEdit={openEditForm} onToggleStatus={toggleStatus} onDelete={deleteStaff} />
          )}
          <div className="staff-side-stack">
            <section className="admin-panel staff-info-card">
              <h3>Access Rules</h3>
              <ul className="staff-rules-list">
                <li>Current account: <strong>{profile?.full_name ?? 'Super Admin'}</strong></li>
                <li>Super admin can create `admin` and `encoder` accounts.</li>
                <li>Admin can only create `encoder` accounts.</li>
                <li>Only super admin can promote, deactivate, reactivate, or delete staff.</li>
                <li>Super admin accounts are protected from deletion.</li>
              </ul>
            </section>
            <section className="admin-panel staff-info-card">
              <h3>Selected Account</h3>
              {selectedStaff ? (
                <div className="staff-selected-summary">
                  <p>{selectedStaff.full_name}</p>
                  <span>{selectedStaff.email}</span>
                  <span>Role: {selectedStaff.role.replace(/_/g, ' ')}</span>
                  <span>Status: {selectedStaff.account_status}</span>
                </div>
              ) : (
                <p className="staff-side-note">Choose Edit from the 3-dot menu to modify role or account details.</p>
              )}
            </section>
          </div>
        </section>

        {showCreateModal ? (
          <div className="staff-modal-backdrop" role="presentation" onClick={closeCreateModal}>
            <section className="staff-modal-card" role="dialog" aria-modal="true" aria-label="Create staff account" onClick={(event) => event.stopPropagation()}>
              <div className="staff-modal-header">
                <div>
                  <span className="staff-modal-eyebrow">New Staff Account</span>
                  <h2>Create User</h2>
                  <p>{isSuperAdmin ? 'Add an admin or encoder account. A temporary password will be auto-generated and sent to their email.' : 'Add a new encoder account. A temporary password will be auto-generated and sent to their email.'}</p>
                </div>
                <button type="button" className="staff-modal-close" aria-label="Close create staff dialog" onClick={closeCreateModal}>
                  ×
                </button>
              </div>
              <form className="staff-form-grid staff-form-grid-modal" onSubmit={submitCreate}>
                {/* Error message inside modal */}
                {error ? (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    background: '#fee2e2', 
                    border: '1px solid #ef4444', 
                    borderRadius: '8px', 
                    padding: '12px 16px',
                    marginBottom: '10px',
                    color: '#dc2626',
                    fontSize: '14px'
                  }}>
                    <strong>❌ Error:</strong> {error}
                  </div>
                ) : null}
                <label>
                  First Name
                  <input value={createForm.firstName} onChange={(event) => updateCreateForm('firstName', event.target.value)} required />
                </label>
                <label>
                  Last Name
                  <input value={createForm.lastName} onChange={(event) => updateCreateForm('lastName', event.target.value)} required />
                </label>
                <label>
                  Username
                  <input value={createForm.username} onChange={(event) => updateCreateForm('username', event.target.value)} required />
                </label>
                <label>
                  Email Address
                  <input 
                    type="email" 
                    value={createForm.email} 
                    onChange={(event) => updateCreateForm('email', event.target.value)} 
                    required 
                    style={{ 
                      borderColor: createForm.email && !isValidEmail(createForm.email) ? '#ef4444' : undefined,
                      backgroundColor: createForm.email && !isValidEmail(createForm.email) ? '#fef2f2' : undefined
                    }}
                  />
                  {createForm.email && !isValidEmail(createForm.email) && (
                    <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      ❌ Please enter a valid email address (e.g., user@example.com)
                    </small>
                  )}
                </label>
                <label>
                  Role
                  <select value={createForm.role} onChange={(event) => updateCreateForm('role', event.target.value as CreateStaffFormState['role'])}>
                    {isSuperAdmin ? <option value="admin">Admin</option> : null}
                    <option value="encoder">Encoder</option>
                  </select>
                </label>
                <div className="staff-form-divider" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e0e0e0', margin: '10px 0' }} />
                <label style={{ gridColumn: '1 / -1' }}>
                  <strong>Your Password (for verification)</strong>
                  <input 
                    type="password" 
                    value={createForm.adminPassword} 
                    onChange={(event) => updateCreateForm('adminPassword', event.target.value)} 
                    placeholder="Enter your password to authorize this action"
                    required 
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Required to verify your identity before creating the account</small>
                </label>
                <div className="staff-form-actions">
                  <button type="button" className="admin-action-button" onClick={closeCreateModal}>
                    <span>Cancel</span>
                  </button>
                  <button 
                    type="submit" 
                    className={`admin-action-button ${isCreateFormValid ? 'is-primary' : 'is-disabled'}`}
                    disabled={saving || !isCreateFormValid}
                    title={!isCreateFormValid ? 'Please fill in all required fields with a valid email address' : undefined}
                    style={{
                      opacity: isCreateFormValid ? 1 : 0.5,
                      cursor: isCreateFormValid ? 'pointer' : 'not-allowed',
                      backgroundColor: isCreateFormValid ? undefined : '#9ca3af',
                    }}
                  >
                    <span>{saving ? 'Creating...' : 'Create Account'}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {/* Success Modal */}
        {showSuccessModal && createdAccount ? (
          <div className="staff-modal-backdrop" role="presentation" onClick={() => setShowSuccessModal(false)}>
            <section 
              className="staff-modal-card staff-modal-card-compact" 
              role="dialog" 
              aria-modal="true" 
              aria-label="Account created successfully" 
              onClick={(event) => event.stopPropagation()}
              style={{ maxWidth: '450px', textAlign: 'center' }}
            >
              <div className="staff-modal-header" style={{ textAlign: 'center', borderBottom: 'none', paddingBottom: '10px' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                  <h2 style={{ color: '#16a34a', marginBottom: '8px' }}>Account Created!</h2>
                  <p style={{ color: '#666', fontSize: '14px' }}>The staff account has been successfully created and activated.</p>
                </div>
              </div>
              
              <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px', margin: '0 20px 20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#166534' }}>👤 Name:</strong>
                  <div style={{ fontSize: '16px', color: '#333' }}>{createdAccount.name}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#166534' }}>📧 Email:</strong>
                  <div style={{ fontSize: '16px', color: '#333' }}>{createdAccount.email}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#166534' }}>🎫 Username:</strong>
                  <div style={{ fontSize: '16px', color: '#333' }}>{createdAccount.username}</div>
                </div>
                <div>
                  <strong style={{ color: '#166534' }}>🔐 Role:</strong>
                  <div style={{ fontSize: '16px', color: '#333', textTransform: 'uppercase' }}>{createdAccount.role}</div>
                </div>
              </div>
              
              <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
                  <strong style={{ color: '#92400e' }}>📨 Important:</strong>
                  <p style={{ color: '#78350f', fontSize: '13px', margin: '8px 0 0' }}>
                    A temporary password has been sent to <strong>{createdAccount.email}</strong>. 
                    The user must change their password on first login.
                  </p>
                </div>
                
                <button 
                  type="button" 
                  className="admin-action-button is-primary" 
                  onClick={() => setShowSuccessModal(false)}
                  style={{ width: '100%' }}
                >
                  <span>Got it!</span>
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {editForm ? (
          <div className="staff-modal-backdrop" role="presentation" onClick={closeEditForm}>
            <section className="staff-modal-card staff-modal-card-compact" role="dialog" aria-modal="true" aria-label="Edit staff account" onClick={(event) => event.stopPropagation()}>
              <div className="staff-modal-header">
                <div>
                  <span className="staff-modal-eyebrow">Staff Account</span>
                  <h2>Edit User</h2>
                  <p>{selectedStaff?.full_name ?? selectedStaff?.email}</p>
                </div>
                <button type="button" className="staff-modal-close" aria-label="Close edit staff dialog" onClick={closeEditForm}>
                  ×
                </button>
              </div>
              <form className="staff-form-grid staff-form-grid-modal" onSubmit={submitEdit}>
                <label>
                  First Name
                  <input value={editForm.firstName} onChange={(event) => updateEditForm('firstName', event.target.value)} required />
                </label>
                <label>
                  Last Name
                  <input value={editForm.lastName} onChange={(event) => updateEditForm('lastName', event.target.value)} required />
                </label>
                <label>
                  Username
                  <input value={editForm.username} onChange={(event) => updateEditForm('username', event.target.value)} required />
                </label>
                <label>
                  Role
                  <select value={editForm.role} onChange={(event) => updateEditForm('role', event.target.value as EditStaffFormState['role'])} disabled={!isSuperAdmin}>
                    {isSuperAdmin ? <option value="admin">Admin</option> : null}
                    <option value="encoder">Encoder</option>
                  </select>
                </label>
                <label>
                  Status
                  <select value={editForm.accountStatus} onChange={(event) => updateEditForm('accountStatus', event.target.value as EditStaffFormState['accountStatus'])} disabled={!isSuperAdmin}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <div className="staff-form-actions">
                  <button type="button" className="admin-action-button" onClick={closeEditForm}>
                    <span>Cancel</span>
                  </button>
                  <button 
                    type="submit" 
                    className={`admin-action-button ${isEditFormValid ? 'is-primary' : 'is-disabled'}`}
                    disabled={saving || !isEditFormValid}
                    title={!isEditFormValid ? 'Please fill in all required fields' : undefined}
                    style={{
                      opacity: isEditFormValid ? 1 : 0.5,
                      cursor: isEditFormValid ? 'pointer' : 'not-allowed',
                      backgroundColor: isEditFormValid ? undefined : '#9ca3af',
                    }}
                  >
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </AdminPortalShell>
  );
};

export default AdminStaffPage;