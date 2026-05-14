'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
  user: any;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [role, setRole] = useState(user.role || 'manager');
  const [department, setDepartment] = useState(user.department || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate({ full_name: fullName, role, department, phone });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Role</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3"
              value={role === 'super_admin' ? 'super_admin' : role === 'manager' || role === 'admin' ? 'manager' : 'user'}
              onChange={(e) => setRole(e.target.value)}
              disabled={user.role === 'super_admin'}
            >
              <option value="user">User · read-only, owns their tasks</option>
              <option value="manager">Manager · full CRM access</option>
              {/* Super admin can only be granted via the database, never the UI. */}
              {user.role === 'super_admin' && (
                <option value="super_admin">Super Admin</option>
              )}
            </select>
            {user.role === 'super_admin' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Super admin role can only be changed directly in the database.
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Department</label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
