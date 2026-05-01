'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { createProject } from '@/lib/api/projects';
import { supabase } from '@/lib/auth';
import { ArrowLeft, ArrowRight, Upload, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('is_active', true);
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    project_name: '',
    assigned_person_id: '',
    supervisor_id: '',
    contact_email: '',
    contact_phone: '',
    start_date: '',
    estimated_end_date: '',
    status: 'Planned' as 'Active' | 'Planned' | 'On Hold' | 'Closed',
  });

  // Step 2: Requirements
  const [requirementsNotes, setRequirementsNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Step 3: Team
  const [team, setTeam] = useState<Array<{ userId: string; name: string; role: string }>>([]);
  const [linkedEmail, setLinkedEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'assigned' | 'operations' | 'sales'>('assigned');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('id, email, full_name')
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const addTeamMember = (user: any) => {
    if (!team.find((m) => m.userId === user.id)) {
      setTeam([...team, { userId: user.id, name: user.full_name || user.email, role: selectedRole }]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeTeamMember = (userId: string) => {
    setTeam(team.filter((m) => m.userId !== userId));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await createProject({
        project_name: basicInfo.project_name,
        assigned_person_id: basicInfo.assigned_person_id || undefined,
        supervisor_id: basicInfo.supervisor_id || undefined,
        contact_email: basicInfo.contact_email,
        contact_phone: basicInfo.contact_phone,
        start_date: basicInfo.start_date,
        estimated_end_date: basicInfo.estimated_end_date,
        requirements_notes: requirementsNotes,
        linked_email: linkedEmail,
        status: basicInfo.status,
        created_by: user.id,
      });

      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = basicInfo.project_name && basicInfo.start_date;
  const canProceedToStep3 = true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-[32px] font-medium text-foreground">New Project</h1>
          <p className="text-[14px] text-muted-foreground">
            Create a new project and assign team members
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card className="surface-card p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-medium text-foreground">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Name *</Label>
                <Input
                  value={basicInfo.project_name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, project_name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <Label>Assigned Person</Label>
                <select
                  value={basicInfo.assigned_person_id}
                  onChange={(e) => setBasicInfo({ ...basicInfo, assigned_person_id: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="">Select employee...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Supervisor</Label>
                <select
                  value={basicInfo.supervisor_id}
                  onChange={(e) => setBasicInfo({ ...basicInfo, supervisor_id: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="">Select supervisor...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={basicInfo.contact_email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={basicInfo.contact_phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, contact_phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>

              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={basicInfo.start_date}
                  onChange={(e) => setBasicInfo({ ...basicInfo, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Estimated End Date</Label>
                <Input
                  type="date"
                  value={basicInfo.estimated_end_date}
                  onChange={(e) => setBasicInfo({ ...basicInfo, estimated_end_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Initial Status</Label>
                <select
                  value={basicInfo.status}
                  onChange={(e) => setBasicInfo({ ...basicInfo, status: e.target.value as any })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="Planned">Planned</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-medium text-foreground">Requirements & Attachments</h2>
            
            <div>
              <Label>Requirements Notes</Label>
              <Textarea
                value={requirementsNotes}
                onChange={(e) => setRequirementsNotes(e.target.value)}
                placeholder="Enter project requirements and notes..."
                rows={4}
              />
            </div>

            <div>
              <Label>File Attachments</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-[13px] text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      PDF, DOCX, XLSX, PNG, JPG (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-[13px] text-foreground"
                    >
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-medium text-foreground">Team Assignment</h2>
            
            <div>
              <Label>Add Team Members</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="h-10 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="assigned">Assigned</option>
                  <option value="operations">Operations</option>
                  <option value="sales">Sales</option>
                </select>
                <Button onClick={handleSearchUsers}>Search</Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 border border-border rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => addTeamMember(user)}
                      className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0"
                    >
                      <p className="text-[13px] font-medium text-foreground">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {team.length > 0 && (
              <div>
                <Label>Selected Team</Label>
                <div className="mt-2 space-y-2">
                  {team.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded-lg border-[0.5px] border-border bg-muted/20"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTeamMember(member.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Linked Email (Optional)</Label>
              <Input
                type="email"
                value={linkedEmail}
                onChange={(e) => setLinkedEmail(e.target.value)}
                placeholder="project-email@example.com"
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedToStep2) ||
                (step === 2 && !canProceedToStep3)
              }
            >
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Save Project'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
