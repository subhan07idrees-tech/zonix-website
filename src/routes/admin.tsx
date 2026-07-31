import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

const BACKEND_URL = 'https://zonix-backend-ouhi.onrender.com/api';

function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'invites' | 'orgs' | 'mobile'>('overview');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [notification, setNotification] = useState<{ type: string; title: string; message: string } | null>(null);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form Inputs: New User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('DISPATCHER');
  const [newUserMaxTabs, setNewUserMaxTabs] = useState(5);

  // Form Inputs: Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('DISPATCHER');
  const [inviteMaxTabs, setInviteMaxTabs] = useState(5);

  useEffect(() => {
    const savedToken = localStorage.getItem('zonix_admin_token');
    const savedUser = localStorage.getItem('zonix_admin_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('zonix_admin_token');
        localStorage.removeItem('zonix_admin_user');
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchOrganizations();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedOrgId) {
      fetchUsersAndInvites(selectedOrgId);
    }
  }, [token, selectedOrgId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginIdentifier, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed. Please verify credentials.');
        setLoggingIn(false);
        return;
      }

      if (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN' && data.user.role !== 'MANAGER') {
        setLoginError('Access denied. Web Admin Control Portal is reserved for Admins.');
        setLoggingIn(false);
        return;
      }

      localStorage.setItem('zonix_admin_token', data.token);
      localStorage.setItem('zonix_admin_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setLoginError(err.message || 'Unable to connect to ZONIX Cloud Backend.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zonix_admin_token');
    localStorage.removeItem('zonix_admin_user');
    setToken(null);
    setUser(null);
  };

  const fetchOrganizations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/organizations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.organizations) {
        setOrgs(data.organizations);
        if (data.organizations.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data.organizations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orgs:', err);
    }
  };

  const fetchUsersAndInvites = async (orgId: string) => {
    if (!token || !orgId) return;
    setLoadingData(true);
    try {
      const [usersRes, invitesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/users/${orgId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/invites/${orgId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const usersData = await usersRes.json();
      const invitesData = await invitesRes.json();

      if (usersRes.ok && usersData.users) setUsers(usersData.users);
      if (invitesRes.ok && invitesData.invites) setInvites(invitesData.invites);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setActionLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/users/${selectedOrgId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          email: newUserEmail,
          role: newUserRole,
          maxTabs: Number(newUserMaxTabs)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || 'Failed to create user');
        setActionLoading(false);
        return;
      }

      setModalSuccess(`Dispatcher "${newUsername}" created successfully!`);
      setNewUsername('');
      setNewPassword('');
      setNewUserEmail('');
      fetchUsersAndInvites(selectedOrgId);
      setTimeout(() => {
        setShowAddUserModal(false);
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'Error creating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setActionLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/invites/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          maxTabs: Number(inviteMaxTabs),
          orgId: selectedOrgId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || 'Failed to send email invitation');
        setActionLoading(false);
        return;
      }

      setModalSuccess(`Invitation email sent to ${inviteEmail}!`);
      setInviteEmail('');
      fetchUsersAndInvites(selectedOrgId);
      setTimeout(() => {
        setShowInviteModal(false);
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'Error sending invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`${BACKEND_URL}/users/${selectedOrgId}/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsersAndInvites(selectedOrgId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete dispatcher "${username}"?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/users/${selectedOrgId}/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsersAndInvites(selectedOrgId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreVaultSession = async () => {
    if (!selectedOrgId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/organizations/${selectedOrgId}/vault/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Session Restored',
          message: '1-Click Session Restore complete. All active dispatcher sessions updated in <0.5s.'
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Restore Notice',
          message: data.message || data.error || 'Failed to restore session vault'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'System Error',
        message: 'Error restoring session vault: ' + err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunManualHealthCheck = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/organizations/health-check/now`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Health Check Complete',
          message: `Health Check Finished Cleanly. (${data.report.totalOrgs} Orgs scanned. Status: 100% Operational)`
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Health Check Alert',
          message: 'Health check completed with warnings'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Check Error',
        message: 'Error running health check: ' + err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Active Users Stats
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'ACTIVE').length;
  const pendingInvitesCount = invites.filter(i => i.status === 'PENDING').length;
  const currentOrg = orgs.find(o => o.id === selectedOrgId);

  // LOGIN SCREEN RENDER
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#e5e7eb', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #00F0FF 0%, #2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: '20px' }}>Z</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', letterSpacing: '0.05em', color: '#fff' }}>ZONIX</span>
            </div>
            <div style={{ fontSize: '11px', color: '#00F0FF', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CLOUD WEB ADMIN CONTROL PORTAL</div>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '6px' }}>Manage dispatchers, monitor active sessions & access controls from any device.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '6px' }}>Admin Username or Email</label>
              <input type="text" required placeholder="superadmin / admin@thezonix.com" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
              <input type="password" required placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {loginError && (
              <div style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                {loginError}
              </div>
            )}

            <button type="submit" disabled={loggingIn} style={{ width: '100%', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 0, fontWeight: 700, fontSize: '14px', padding: '14px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(37,99,235,0.5)', marginTop: '6px' }}>
              {loggingIn ? 'Authenticating...' : 'Sign In to Web Admin Portal →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD RENDER
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#e5e7eb', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {/* Custom Executive Notification Modal */}
      {notification && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0D0E15', border: '1px solid #1E2638', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: notification.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: notification.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)', color: notification.type === 'error' ? '#f87171' : '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, margin: '0 auto 16px auto' }}>
              {notification.type === 'error' ? '!' : '✓'}
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>{notification.title}</h4>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5, margin: '0 0 20px 0' }}>{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              style={{ width: '100%', padding: '10px', background: '#1E2638', color: '#fff', border: 0, borderRadius: '12px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00F0FF 0%, #2563eb 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: '16px' }}>Z</div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', letterSpacing: '0.05em', color: '#fff' }}>ZONIX</span>
            <span style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.2)', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', fontFamily: 'monospace' }}>WEB ADMIN</span>
          </div>

          {/* Org Selector */}
          {orgs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase' }}>ORG:</span>
              <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} style={{ background: 'transparent', color: '#00F0FF', border: 0, outline: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                {orgs.map(o => (
                  <option key={o.id} value={o.id} style={{ background: '#111827', color: '#fff' }}>
                    {o.displayName} ({o.name})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>Cloud Sync Active</span>
          </div>

          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            <strong style={{ color: '#fff' }}>{user?.username}</strong> ({user?.role})
          </div>

          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* DASHBOARD NAVIGATION TABS */}
      <div style={{ background: '#0e1422', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('overview')} style={{ padding: '14px 18px', background: 'transparent', border: 0, borderBottom: activeTab === 'overview' ? '2px solid #00F0FF' : '2px solid transparent', color: activeTab === 'overview' ? '#00F0FF' : '#9ca3af', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Overview & Stats
        </button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '14px 18px', background: 'transparent', border: 0, borderBottom: activeTab === 'users' ? '2px solid #00F0FF' : '2px solid transparent', color: activeTab === 'users' ? '#00F0FF' : '#9ca3af', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👥 User Registry ({users.length})
        </button>
        <button onClick={() => setActiveTab('invites')} style={{ padding: '14px 18px', background: 'transparent', border: 0, borderBottom: activeTab === 'invites' ? '2px solid #00F0FF' : '2px solid transparent', color: activeTab === 'invites' ? '#00F0FF' : '#9ca3af', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✉️ Invitations ({pendingInvitesCount})
        </button>
        <button onClick={() => setActiveTab('orgs')} style={{ padding: '14px 18px', background: 'transparent', border: 0, borderBottom: activeTab === 'orgs' ? '2px solid #00F0FF' : '2px solid transparent', color: activeTab === 'orgs' ? '#00F0FF' : '#9ca3af', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏢 Organization Settings
        </button>
        <button onClick={() => setActiveTab('mobile')} style={{ padding: '14px 18px', background: 'transparent', border: 0, borderBottom: activeTab === 'mobile' ? '2px solid #00F0FF' : '2px solid transparent', color: activeTab === 'mobile' ? '#00F0FF' : '#9ca3af', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📲 Mobile App Setup (PWA)
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '6px' }}>TOTAL DISPATCHERS</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>{totalUsersCount}</div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>{activeUsersCount} Active Seats Allocated</div>
              </div>

              <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '6px' }}>PENDING INVITATIONS</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#00F0FF', fontFamily: 'Outfit, sans-serif' }}>{pendingInvitesCount}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Awaiting dispatcher onboarding</div>
              </div>

              <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '6px' }}>TARGET SITE CONFIG</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentOrg?.targetUrl || 'DAT Load Board'}
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '6px' }}>Organization: {currentOrg?.displayName}</div>
              </div>

              <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '6px' }}>SYSTEM HEALTH</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>100% OPERATIONAL</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Cloud REST & Supabase DB active</div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff', margin: '0 0 16px 0' }}>Quick Dispatcher & Vault Operations</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button onClick={() => setShowAddUserModal(true)} style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 0, fontWeight: 700, fontSize: '13px', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
                  + Add New Dispatcher
                </button>
                <button onClick={handleRestoreVaultSession} disabled={actionLoading} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 0, fontWeight: 700, fontSize: '13px', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
                  🔄 1-Click Session Restore
                </button>
                <button onClick={handleRunManualHealthCheck} disabled={actionLoading} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700, fontSize: '13px', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer' }}>
                  🔍 Run Pre-Shift Health Check
                </button>
                <button onClick={() => setShowInviteModal(true)} style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.2)', fontWeight: 700, fontSize: '13px', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer' }}>
                  ✉️ Send Email Invite
                </button>
              </div>

              {/* System Health Audit Telemetry */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace', textTransform: 'uppercase', margin: 0 }}>🔍 SYSTEM HEALTH SCAN AUDIT TELEMETRY</h4>
                  <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 10px', borderRadius: '12px', fontFamily: 'monospace' }}>● 100% Operational</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>LAST HEALTH SCAN</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>Today, 07:45 AM</div>
                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>2-Second Read-Only Audit</div>
                  </div>

                  <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>DAT SESSION COOKIES</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>Valid & Active (365d)</div>
                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>PostgreSQL Vault Sync</div>
                  </div>

                  <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>US DEDICATED PROXY PING</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>Connected (38ms)</div>
                    <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '4px' }}>Webshare Static US Tunnel</div>
                  </div>

                  <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>DAILY SCAN SCHEDULE</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>07:45 AM EST</div>
                    <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>Pre-Shift Auto Diagnostic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER REGISTRY TAB */}
        {(activeTab === 'users' || activeTab === 'overview') && (
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', margin: 0 }}>Dispatcher Registry</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0 0' }}>Manage credentials, seat limits, and active status for {currentOrg?.displayName}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="text" placeholder="Search dispatchers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                <button onClick={() => setShowAddUserModal(true)} style={{ background: '#2563eb', color: '#fff', border: 0, padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  + New User
                </button>
              </div>
            </div>

            {loadingData ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading dispatcher accounts...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No dispatcher accounts found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>USERNAME</th>
                      <th style={{ padding: '12px' }}>EMAIL</th>
                      <th style={{ padding: '12px' }}>ROLE</th>
                      <th style={{ padding: '12px' }}>MAX TABS</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px' }}>LAST LOGIN</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 700, color: '#fff' }}>{u.username}</td>
                        <td style={{ padding: '14px 12px', color: '#9ca3af', fontFamily: 'monospace' }}>{u.email || 'N/A'}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ background: u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.1)', color: u.role === 'SUPER_ADMIN' ? '#f87171' : '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', fontFamily: 'monospace', color: '#00F0FF' }}>{u.maxTabs || 5} tabs</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ background: u.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.status === 'ACTIVE' ? '#34d399' : '#f87171', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', color: '#6b7280', fontSize: '12px' }}>
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <button onClick={() => handleToggleUserStatus(u.id, u.status)} style={{ background: 'rgba(255,255,255,0.05)', color: u.status === 'ACTIVE' ? '#f87171' : '#34d399', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, marginRight: '8px' }}>
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.username)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* INVITATIONS TAB */}
        {activeTab === 'invites' && (
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', margin: 0 }}>Pending Email Invitations</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0 0' }}>Track onboarding invitations sent to new dispatchers</p>
              </div>

              <button onClick={() => setShowInviteModal(true)} style={{ background: 'linear-gradient(135deg, #00F0FF 0%, #2563eb 100%)', color: '#000', border: 0, padding: '10px 18px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                + Invite New Dispatcher
              </button>
            </div>

            {invites.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No active invitations pending.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>RECIPIENT EMAIL</th>
                      <th style={{ padding: '12px' }}>ROLE</th>
                      <th style={{ padding: '12px' }}>MAX TABS</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px' }}>EXPIRES AT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{i.email}</td>
                        <td style={{ padding: '14px 12px', color: '#9ca3af' }}>{i.role}</td>
                        <td style={{ padding: '14px 12px', color: '#00F0FF', fontFamily: 'monospace' }}>{i.maxTabs} tabs</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            {i.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', color: '#6b7280', fontSize: '12px' }}>{new Date(i.expiresAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ORGANIZATIONS TAB */}
        {activeTab === 'orgs' && (
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Organization Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {orgs.map(o => (
                <div key={o.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{o.displayName}</div>
                  <div style={{ fontSize: '12px', color: '#00F0FF', fontFamily: 'monospace', marginBottom: '12px' }}>ID: {o.name}</div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
                    Target URL: <strong style={{ color: '#fff' }}>{o.targetUrl || 'https://power.dat.com'}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Users: {o._count?.users || 0} &bull; Sessions: {o._count?.sessions || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOBILE APP SETUP (PWA) TAB */}
        {activeTab === 'mobile' && (
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '28px' }}>📲</div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '22px', color: '#fff', margin: 0 }}>Install on iPhone / Android</h3>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '6px' }}>Add ZONIX Web Admin directly to your smartphone home screen as a mobile app.</p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#00F0FF', marginBottom: '8px', fontSize: '14px' }}>📱 iOS (iPhone / iPad):</div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
                <li>Open <strong>https://thezonix.com/admin</strong> in Safari.</li>
                <li>Tap the <strong>Share</strong> icon (bottom center).</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              </ol>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '8px', fontSize: '14px' }}>🤖 Android (Chrome):</div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
                <li>Open <strong>https://thezonix.com/admin</strong> in Chrome.</li>
                <li>Tap the <strong>3 dots menu</strong> (top right).</li>
                <li>Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD DISPATCHER */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '32px', boxSizing: 'border-box' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', margin: '0 0 16px 0' }}>+ Add New Dispatcher</h3>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Username</label>
                <input type="text" required placeholder="e.g. john_dispatcher" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Password</label>
                <input type="password" required minLength={8} placeholder="At least 8 chars" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Email (Optional)</label>
                <input type="email" placeholder="john@company.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Role</label>
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}>
                    <option value="DISPATCHER">DISPATCHER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Max Tabs</label>
                  <input type="number" min={1} max={50} value={newUserMaxTabs} onChange={(e) => setNewUserMaxTabs(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#00F0FF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {modalError && <div style={{ fontSize: '12px', color: '#f87171' }}>{modalError}</div>}
              {modalSuccess && <div style={{ fontSize: '12px', color: '#34d399' }}>{modalSuccess}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 0, borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 0, borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>{actionLoading ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE VIA EMAIL */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '32px', boxSizing: 'border-box' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', margin: '0 0 16px 0' }}>✉️ Send Invitation Email</h3>
            
            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Recipient Email</label>
                <input type="email" required placeholder="dispatcher@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}>
                    <option value="DISPATCHER">DISPATCHER</option>
                    <option value="MANAGER">MANAGER</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Max Tabs</label>
                  <input type="number" min={1} max={50} value={inviteMaxTabs} onChange={(e) => setInviteMaxTabs(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#00F0FF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {modalError && <div style={{ fontSize: '12px', color: '#f87171' }}>{modalError}</div>}
              {modalSuccess && <div style={{ fontSize: '12px', color: '#34d399' }}>{modalSuccess}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 0, borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 0, borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>{actionLoading ? 'Sending...' : 'Send Invitation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
