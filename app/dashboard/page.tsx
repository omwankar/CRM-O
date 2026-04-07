'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import {
  Award,
  Users,
  Shield,
  Package,
  ShoppingCart,
  FileText,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    certifications: 0,
    memberships: 0,
    insurance: 0,
    vendors: 0,
    buyers: 0,
    documents: 0,
  });

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'manager',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  // 🔥 FETCH EVERYTHING
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        console.log('Auth ID:', user.id);

        // ✅ FETCH ROLE
        const { data: roleData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Role fetch error:', error);
        }

        const userRole = roleData?.role || null;
        setRole(userRole);

        console.log('ROLE:', userRole);

        // 🔥 ONLY SUPER ADMIN FETCH USERS
        if (userRole === 'super_admin') {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, email, role');

          setUsers(usersData || []);
        }

        // 🔹 FETCH STATS
        const [
          { count: certCount },
          { count: membCount },
          { count: insCount },
          { count: vendCount },
          { count: buyCount },
          { count: docCount },
        ] = await Promise.all([
          supabase
            .from('certifications')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('memberships')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('insurance')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('vendors')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('buyers')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          certifications: certCount || 0,
          memberships: membCount || 0,
          insurance: insCount || 0,
          vendors: vendCount || 0,
          buyers: buyCount || 0,
          documents: docCount || 0,
        });
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // 🔥 CHANGE ROLE (ONLY SUPER ADMIN)
  const changeRole = async (id: string, newRole: string) => {
    // Extra safety: UI is only visible to super_admin, but RLS is the real gate.
    if (role !== 'super_admin') return;

    // Match your DB enum: ('super_admin', 'admin', 'manager')
    if (!['super_admin', 'admin', 'manager'].includes(newRole)) return;

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', id);

    if (!error) {
      const { data } = await supabase
        .from('users')
        .select('id, email, role');

      setUsers(data || []);
    } else {
      console.error('Role update failed:', error);
    }
  };

  const refreshUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, role');
    setUsers(data || []);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMessage('');

    if (role !== 'super_admin') {
      setInviteMessage('Only super admin can invite users.');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to invite user');
      }

      setInviteMessage('User invited/created successfully.');
      setInviteForm({
        email: '',
        fullName: '',
        password: '',
        role: 'manager',
      });
      await refreshUsers();
    } catch (error: any) {
      setInviteMessage(error?.message || 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  // 🔥 WIDGETS
  const widgets = [
    {
      label: 'Certifications',
      value: stats.certifications,
      icon: Award,
      href: '/dashboard/certifications',
    },
    {
      label: 'Memberships',
      value: stats.memberships,
      icon: Users,
      href: '/dashboard/memberships',
    },
    {
      label: 'Insurance',
      value: stats.insurance,
      icon: Shield,
      href: '/dashboard/insurance',
    },
    {
      label: 'Vendors',
      value: stats.vendors,
      icon: Package,
      href: '/dashboard/vendors',
    },
    {
      label: 'Buyers',
      value: stats.buyers,
      icon: ShoppingCart,
      href: '/dashboard/buyers',
    },
    {
      label: 'Documents',
      value: stats.documents,
      icon: FileText,
      href: '/dashboard/documents',
    },
  ];

  // 🔥 ROLE COLORS
  const getRoleColor = (role: string) => {
    if (role === 'super_admin') return 'text-red-500';
    if (role === 'admin') return 'text-blue-500';
    return 'text-gray-500';
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome to your CRM portal
        </p>
        </div>
        <p className={`rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium ${getRoleColor(role || '')}`}>
          Role: {role || 'Loading...'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <Card key={w.label} className="p-6 animate-pulse surface-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => {
            const Icon = w.icon;
            return (
              <Card
                key={w.label}
                className="surface-card cursor-pointer p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => router.push(w.href)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {w.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {w.value}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-primary/80" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="surface-card p-6">
        <h2 className="text-xl font-semibold mb-2">
          Quick Start
        </h2>
        <p className="text-muted-foreground">
          Manage your business data using modules above.
        </p>
      </Card>

      {role === 'super_admin' && users.length > 0 && (
        <Card className="surface-card p-6">
          <h2 className="text-xl font-semibold mb-4">
            User & Admin Management
          </h2>

          <form onSubmit={handleInviteUser} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              type="email"
              placeholder="Email"
              className="h-10 rounded-lg border border-border/70 bg-background px-3 py-2"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Full name"
              className="h-10 rounded-lg border border-border/70 bg-background px-3 py-2"
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Temporary password"
              className="h-10 rounded-lg border border-border/70 bg-background px-3 py-2"
              value={inviteForm.password}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <select
              className="h-10 rounded-lg border border-border/70 bg-background px-3 py-2"
              value={inviteForm.role}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button
              type="submit"
              className="h-10 rounded-lg bg-primary px-3 py-2 text-primary-foreground shadow-sm disabled:opacity-50"
              disabled={inviteLoading}
            >
              {inviteLoading ? 'Creating...' : 'Add User'}
            </button>
          </form>

          {inviteMessage && (
            <p className="text-sm mb-4 text-muted-foreground">{inviteMessage}</p>
          )}

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3"
              >
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className={`text-sm ${getRoleColor(u.role)}`}>
                    {u.role}
                  </p>
                </div>

                <select
                  value={u.role}
                  onChange={(e) =>
                    changeRole(u.id, e.target.value)
                  }
                  className="rounded-lg border border-border/70 bg-background px-2 py-1"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}