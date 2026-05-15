'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Copy, RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface InviteUserModalProps {
  onClose: () => void;
}

/**
 * "Add User" modal (super_admin).
 *
 * Creates the user instantly with `email_confirm=true` on the backend so they
 * can log in right away - no invite link, no confirmation email.
 *
 * Behaviour:
 *   - Admin types name + email + role + (optional) password.
 *   - If password is blank, the server generates one.
 *   - After success the modal shows the credentials so the admin can copy them
 *     to share with the new user. This is the ONLY time the password is shown.
 */
export function InviteUserModal({ onClose }: InviteUserModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'manager' | 'user'>('user');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [autoEmployeeId, setAutoEmployeeId] = useState(true);
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'probation' | 'commission'>('full_time');
  const [workMode, setWorkMode] = useState<'office' | 'remote'>('office');
  const [created, setCreated] = useState<{
    email: string;
    employee_id: string;
    password: string;
    generated: boolean;
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreated({
        email: res.credentials.email,
        employee_id: res.credentials.employee_id,
        password: res.credentials.password,
        generated: res.credentials.password_was_generated,
      });
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create user');
    },
  });

  const generatePassword = () => {
    // 14 mixed chars - enough for the backend's min(8) and not painful to type.
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let out = '';
    for (let i = 0; i < 14; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(out);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({
      email,
      full_name: fullName,
      role,
      department,
      phone,
      password: password || undefined,
      employee_id: autoEmployeeId ? undefined : employeeId.trim() || undefined,
      employment_type: employmentType,
      work_mode: workMode,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed - select and copy manually');
    }
  };

  const copyAll = () => {
    if (!created) return;
    const text = `Employee ID: ${created.employee_id}\nEmail: ${created.email}\nPassword: ${created.password}\nSign in with Employee ID or email at: ${window.location.origin}/auth/login`;
    void copyToClipboard(text, 'Credentials');
  };

  // ---- Success view: credentials display ----
  if (created) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              User created
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
              Share these credentials with the new user. The password
              <strong> won&apos;t be shown again</strong> - they can change it from
              their profile after signing in.
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Employee ID</label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={created.employee_id} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(created.employee_id, 'Employee ID')}
                  title="Copy employee ID"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={created.email} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(created.email, 'Email')}
                  title="Copy email"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Password {created.generated ? '(auto-generated)' : ''}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={created.password}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(created.password, 'Password')}
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={copyAll}>
              <Copy className="w-4 h-4 mr-2" /> Copy all
            </Button>
            <Button type="button" onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ---- Form view ----
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            The user can sign in immediately - no email confirmation required.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Full Name *</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email Address *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoEmployeeId}
                onChange={(e) => setAutoEmployeeId(e.target.checked)}
              />
              Auto-generate Employee ID (e.g. EMP0001)
            </label>
            {!autoEmployeeId && (
              <Input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="EMP0001"
                pattern="[A-Za-z0-9]+"
                title="Letters and numbers only"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Employment type</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="probation">Probation</option>
                <option value="commission">Commission</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Work mode</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as typeof workMode)}
              >
                <option value="office">Office</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Role *</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3"
              value={role}
              onChange={(e) => setRole(e.target.value as 'manager' | 'user')}
              required
            >
              <option value="user">User · read-only, can update tasks allocated to them</option>
              <option value="manager">Manager · full read/write across the CRM</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Password{' '}
              <span className="text-xs text-muted-foreground">
                (leave blank to auto-generate)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  placeholder="Min 8 characters"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                title="Generate a random password"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Department</label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
