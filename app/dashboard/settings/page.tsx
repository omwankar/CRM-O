'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users, GitBranch, Settings, Mail, FileText, History } from 'lucide-react';

type Tab = 'users' | 'pipeline' | 'custom_fields' | 'email_templates' | 'audit';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const tabs = [
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'pipeline' as Tab, label: 'Pipeline', icon: GitBranch },
    { id: 'custom_fields' as Tab, label: 'Custom Fields', icon: Settings },
    { id: 'email_templates' as Tab, label: 'Email Templates', icon: Mail },
    { id: 'audit' as Tab, label: 'Audit Log', icon: History },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your CRM configuration and preferences</p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="text-muted-foreground mb-4">Manage user roles and permissions</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Admin</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-muted-foreground">jane@example.com</p>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">User</span>
              </div>
              <Button>Add New User</Button>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pipeline Configuration</h2>
            <p className="text-muted-foreground mb-4">Configure your sales pipeline stages</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <Input defaultValue="Lead" className="flex-1" />
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <Input defaultValue="Qualified" className="flex-1" />
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <Input defaultValue="Closed Won" className="flex-1" />
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <Button>Add Stage</Button>
            </div>
          </div>
        )}

        {activeTab === 'custom_fields' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Custom Fields</h2>
            <p className="text-muted-foreground mb-4">Add custom fields to your records</p>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Industry</p>
                  <span className="text-xs text-muted-foreground">Buyers</span>
                </div>
                <p className="text-sm text-muted-foreground">Text field</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Priority Level</p>
                  <span className="text-xs text-muted-foreground">Vendors</span>
                </div>
                <p className="text-sm text-muted-foreground">Dropdown</p>
              </div>
              <Button>Add Custom Field</Button>
            </div>
          </div>
        )}

        {activeTab === 'email_templates' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
            <p className="text-muted-foreground mb-4">Manage email templates for notifications</p>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Welcome Email</p>
                <p className="text-sm text-muted-foreground mt-1">Sent when a new user is added</p>
                <Button variant="outline" size="sm" className="mt-2">Edit Template</Button>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Expiry Alert</p>
                <p className="text-sm text-muted-foreground mt-1">Sent before certifications expire</p>
                <Button variant="outline" size="sm" className="mt-2">Edit Template</Button>
              </div>
              <Button>Create New Template</Button>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Audit Log</h2>
            <p className="text-muted-foreground mb-4">Track all changes in the system</p>
            <div className="space-y-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">Updated buyer: Acme Corp</p>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                <p className="text-xs text-muted-foreground">Changed status from Lead to Qualified</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">Created new vendor: Tech Supplies</p>
                  <span className="text-xs text-muted-foreground">5 hours ago</span>
                </div>
                <p className="text-xs text-muted-foreground">Added by John Doe</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">Deleted document: Contract.pdf</p>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
                <p className="text-xs text-muted-foreground">Soft deleted by Admin</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
