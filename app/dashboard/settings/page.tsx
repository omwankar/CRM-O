'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    cert_expiry_days: 30,
    membership_expiry_days: 30,
    insurance_expiry_days: 30,
    alert_email: '',
    enable_email_alerts: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFormData({
          cert_expiry_days: data.cert_expiry_days || 30,
          membership_expiry_days: data.membership_expiry_days || 30,
          insurance_expiry_days: data.insurance_expiry_days || 30,
          alert_email: data.alert_email || '',
          enable_email_alerts: data.enable_email_alerts || true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { error } = await supabase.from('admin_settings').upsert(
        {
          user_id: userId,
          ...formData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="page-shell max-w-3xl">
      <div className="page-header">
        <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your CRM preferences and alert settings</p>
        </div>
      </div>

      <Card className="surface-card p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Expiry Alert Configuration</h2>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully')
              ? 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
              : 'border border-destructive/40 bg-destructive/15 text-destructive'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-muted-foreground mb-6">
            Configure how many days before expiry dates you want to be alerted
          </p>

          <FieldGroup>
            <FieldLabel htmlFor="cert_expiry_days">
              Certification Expiry Alert (Days Before)
            </FieldLabel>
            <Input
              id="cert_expiry_days"
              name="cert_expiry_days"
              type="number"
              min="1"
              max="365"
              value={formData.cert_expiry_days}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll be alerted this many days before a certification expires
            </p>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="membership_expiry_days">
              Membership Expiry Alert (Days Before)
            </FieldLabel>
            <Input
              id="membership_expiry_days"
              name="membership_expiry_days"
              type="number"
              min="1"
              max="365"
              value={formData.membership_expiry_days}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll be alerted this many days before a membership expires
            </p>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="insurance_expiry_days">
              Insurance Expiry Alert (Days Before)
            </FieldLabel>
            <Input
              id="insurance_expiry_days"
              name="insurance_expiry_days"
              type="number"
              min="1"
              max="365"
              value={formData.insurance_expiry_days}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll be alerted this many days before an insurance policy expires
            </p>
          </FieldGroup>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Email Notifications</h3>

            <FieldGroup>
              <FieldLabel htmlFor="alert_email">Alert Email Address</FieldLabel>
              <Input
                id="alert_email"
                name="alert_email"
                type="email"
                placeholder="alerts@example.com"
                value={formData.alert_email}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email address where expiry alerts will be sent
              </p>
            </FieldGroup>

            <FieldGroup className="flex items-center gap-3">
              <input
                id="enable_email_alerts"
                name="enable_email_alerts"
                type="checkbox"
                checked={formData.enable_email_alerts}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <FieldLabel htmlFor="enable_email_alerts" className="mb-0">
                Enable email alerts
              </FieldLabel>
            </FieldGroup>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="surface-card p-8 bg-muted/40">
        <h3 className="text-lg font-semibold text-foreground mb-2">About This CRM</h3>
        <p className="text-sm text-muted-foreground">
          This CRM system helps you manage certifications, memberships, partnerships, insurance policies, vendors, buyers, and documents all in one place. Set your alert preferences above to stay on top of important expiration dates.
        </p>
      </Card>
    </div>
  );
}
