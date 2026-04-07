'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Empty } from '@/components/ui/empty';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Alert {
  id: string;
  type: 'certification' | 'membership' | 'insurance' | 'partnership';
  name: string;
  expiry_date: string;
  days_until_expiry: number;
  status: 'expired' | 'expiring_soon' | 'ok';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    cert_expiry_days: 30,
    membership_expiry_days: 30,
    insurance_expiry_days: 30,
  });

  useEffect(() => {
    fetchAlertsAndSettings();
  }, []);

  const fetchAlertsAndSettings = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Fetch user settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsData) {
        setSettings({
          cert_expiry_days: settingsData.cert_expiry_days || 30,
          membership_expiry_days: settingsData.membership_expiry_days || 30,
          insurance_expiry_days: settingsData.insurance_expiry_days || 30,
        });
      }

      // Fetch all items that might be expiring
      const today = new Date();
      const allAlerts: Alert[] = [];

      // Check certifications
      const { data: certs } = await supabase.from('certifications').select('*');
      if (certs) {
        certs.forEach((cert) => {
          const expiry = new Date(cert.expiry_date);
          const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= settings.cert_expiry_days) {
            allAlerts.push({
              id: cert.id,
              type: 'certification',
              name: cert.name,
              expiry_date: cert.expiry_date,
              days_until_expiry: daysUntil,
              status: daysUntil < 0 ? 'expired' : daysUntil < 1 ? 'expiring_soon' : 'ok',
            });
          }
        });
      }

      // Check memberships
      const { data: memberships } = await supabase.from('memberships').select('*');
      if (memberships) {
        memberships.forEach((mem) => {
          const expiry = new Date(mem.renewal_date);
          const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= settings.membership_expiry_days) {
            allAlerts.push({
              id: mem.id,
              type: 'membership',
              name: mem.organization_name,
              expiry_date: mem.renewal_date,
              days_until_expiry: daysUntil,
              status: daysUntil < 0 ? 'expired' : daysUntil < 1 ? 'expiring_soon' : 'ok',
            });
          }
        });
      }

      // Check insurance
      const { data: insurances } = await supabase.from('insurance').select('*');
      if (insurances) {
        insurances.forEach((ins) => {
          const expiry = new Date(ins.end_date);
          const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= settings.insurance_expiry_days) {
            allAlerts.push({
              id: ins.id,
              type: 'insurance',
              name: `${ins.provider} (${ins.insurance_type})`,
              expiry_date: ins.end_date,
              days_until_expiry: daysUntil,
              status: daysUntil < 0 ? 'expired' : daysUntil < 1 ? 'expiring_soon' : 'ok',
            });
          }
        });
      }

      // Sort by days until expiry (expired first)
      allAlerts.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertStyles = (status: string) => {
    switch (status) {
      case 'expired':
        return 'border-red-500/35 bg-red-500/12';
      case 'expiring_soon':
        return 'border-amber-500/35 bg-amber-500/12';
      default:
        return 'border-emerald-500/35 bg-emerald-500/12';
    }
  };

  const getAlertIcon = (status: string) => {
    return status === 'expired' || status === 'expiring_soon' ? (
      <AlertCircle className="w-5 h-5 text-red-500" />
    ) : (
      <CheckCircle className="w-5 h-5 text-emerald-600" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusText = (daysUntil: number) => {
    if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} days ago`;
    if (daysUntil === 0) return 'Expires today';
    if (daysUntil === 1) return 'Expires tomorrow';
    return `Expires in ${daysUntil} days`;
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
        <h1 className="page-title">Alerts & Expiries</h1>
        <p className="page-subtitle">Monitor upcoming expirations across all modules</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="surface-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">All clear!</h2>
          <p className="text-muted-foreground">No items expiring soon. Keep monitoring your CRM.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card
              key={`${alert.type}-${alert.id}`}
              className={`surface-card border-l-4 p-6 ${getAlertStyles(alert.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getAlertIcon(alert.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{alert.name}</h3>
                      <span className="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground">
                        {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                      </span>
                    </div>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {getStatusText(alert.days_until_expiry)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expiry Date: {formatDate(alert.expiry_date)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}