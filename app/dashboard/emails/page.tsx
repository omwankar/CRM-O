'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail,
  RefreshCw,
  Search,
  Inbox,
  Link2,
  Paperclip,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Users,
  Check,
  Phone,
  Building2,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  discoverCompanyMailboxes,
  getCompanyEmails,
  getEmailContacts,
  getEmailStats,
  getMailboxes,
  importEmailContacts,
  purgeSyncedEmails,
  syncCompanyEmails,
  type CompanyEmail,
  type ExtractedEmailContact,
} from '@/lib/api/emails';
import { EmailDetailDialog, EmailListMeta } from '@/components/emails/EmailDetailDialog';
import { formatUkDateTime } from '@/lib/date';

function formatDate(iso: string) {
  return formatUkDateTime(iso, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function LinkBadges({ email }: { email: CompanyEmail }) {
  const badges = [];
  if (email.buyer_id) badges.push({ label: 'Buyer', href: `/dashboard/buyers/${email.buyer_id}` });
  if (email.contact_id) badges.push({ label: 'Contact', href: `/dashboard/contacts` });
  if (email.project_id) badges.push({ label: 'Project', href: `/dashboard/projects/${email.project_id}` });
  if (!badges.length) return <EmailListMeta email={email} />;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <EmailListMeta email={email} />
      {badges.map((b) => (
        <Badge key={b.label} variant="secondary" className="text-[10px]">
          <Link2 className="w-3 h-3 mr-1" />
          {b.label}
        </Badge>
      ))}
    </div>
  );
}

function ExtractContactsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['email-contacts-extract'],
    queryFn: getEmailContacts,
    enabled: open,
  });

  const contacts = data?.data || [];
  const filtered = contacts.filter((c) => {
    if (!contactSearch) return true;
    const s = contactSearch.toLowerCase();
    return (
      c.email.toLowerCase().includes(s) ||
      (c.name || '').toLowerCase().includes(s) ||
      (c.company || '').toLowerCase().includes(s)
    );
  });

  const newContacts = filtered.filter((c) => !c.already_contact);
  const allNewSelected = newContacts.length > 0 && newContacts.every((c) => selected.has(c.email));

  function toggleAll() {
    if (allNewSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(newContacts.map((c) => c.email)));
    }
  }

  const importMut = useMutation({
    mutationFn: (items: ExtractedEmailContact[]) => importEmailContacts(items),
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported} contact${result.imported !== 1 ? 's' : ''}${result.skipped ? `, ${result.skipped} already existed` : ''}`);
      if (result.errors?.length) {
        toast.error(`${result.errors.length} failed to import`);
      }
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['email-contacts-extract'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleImport() {
    const toImport = contacts.filter((c) => selected.has(c.email));
    if (!toImport.length) return;
    importMut.mutate(toImport);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Extract Contacts from Emails
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          Unique senders found in your inbox. Phone and company are parsed from email signatures (available after next sync).
        </p>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email or company…"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
          </div>
          {newContacts.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {allNewSelected ? 'Deselect all' : `Select all new (${newContacts.length})`}
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading senders…</p>
        ) : (
          <div className="overflow-y-auto flex-1 border rounded-md divide-y">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">No senders found</p>
            ) : (
              filtered.map((c) => (
                <label
                  key={c.email}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors ${c.already_contact ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    disabled={c.already_contact}
                    checked={selected.has(c.email)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      e.target.checked ? next.add(c.email) : next.delete(c.email);
                      setSelected(next);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{c.name || c.email}</span>
                      {c.already_contact && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          <Check className="w-3 h-3 mr-1" /> Already a contact
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {c.count} email{c.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      {c.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </span>
                      )}
                      {c.company && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {c.company}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {selected.size} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={selected.size === 0 || importMut.isPending}
            >
              {importMut.isPending ? 'Importing…' : `Import ${selected.size || ''} contacts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyEmailsPage() {
  const qc = useQueryClient();
  const { isSuperAdmin, canWrite, profile, isLoading: userLoading } = useCurrentUser();
  const inboxEnabled = !userLoading;

  const [search, setSearch] = useState('');
  const [mailbox, setMailbox] = useState('all');
  const [linked, setLinked] = useState('all');
  const [category, setCategory] = useState('all');
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: stats, error: statsError, isError: statsIsError } = useQuery({
    queryKey: ['email-stats'],
    queryFn: getEmailStats,
    enabled: inboxEnabled,
  });

  const { data: mailboxesData } = useQuery({
    queryKey: ['email-mailboxes'],
    queryFn: getMailboxes,
    enabled: inboxEnabled,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['company-emails', search, mailbox, linked, category],
    queryFn: () =>
      getCompanyEmails({
        search: search || undefined,
        mailbox: isSuperAdmin && mailbox !== 'all' ? mailbox : undefined,
        linked: linked === 'all' ? undefined : (linked as 'true' | 'false'),
        category: category === 'all' ? undefined : (category as 'lead' | 'quotation' | 'followup' | 'uncategorized'),
        limit: 50,
      }),
    enabled: inboxEnabled,
  });

  const discoverMut = useMutation({
    mutationFn: discoverCompanyMailboxes,
    onSuccess: (result) => {
      setDiscoverOpen(true);
      toast.success(`Azure AD: ${result.included} mailboxes will sync (${result.total} members total)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purgeMut = useMutation({
    mutationFn: purgeSyncedEmails,
    onSuccess: (result) => {
      toast.success(`Removed ${result.deleted_emails} synced emails`);
      qc.invalidateQueries({ queryKey: ['company-emails'] });
      qc.invalidateQueries({ queryKey: ['email-stats'] });
      qc.invalidateQueries({ queryKey: ['email-mailboxes'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncMut = useMutation({
    mutationFn: syncCompanyEmails,
    onSuccess: (result) => {
      toast.success(
        `Synced ${result.messages_upserted} messages from ${result.mailboxes_synced} mailboxes (${result.mailboxes_discovered ?? result.mailboxes_synced} discovered in Azure)`,
      );
      qc.invalidateQueries({ queryKey: ['company-emails'] });
      qc.invalidateQueries({ queryKey: ['email-stats'] });
      qc.invalidateQueries({ queryKey: ['email-mailboxes'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statCards = useMemo(
    () => [
      { label: 'Total emails', value: stats?.total ?? 0 },
      ...(isSuperAdmin ? [{ label: 'Mailboxes', value: stats?.mailboxes ?? 0 }] : []),
      { label: 'Unlinked', value: stats?.unlinked ?? 0 },
    ],
    [stats, isSuperAdmin],
  );

  if (userLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const emails = data?.data || [];
  const mailboxes = mailboxesData?.data || [];
  const lastSync = stats?.last_sync;
  const ownMailbox = stats?.mailbox_email || profile?.email || '';
  const hasActiveFilters = Boolean(search) || category !== 'all' || linked !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Inbox className="w-8 h-8" />
            {isSuperAdmin ? 'Company Inbox' : 'My Inbox'}
          </h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? 'All company Outlook mailboxes from Azure AD'
              : `Your synced Outlook mailbox${ownMailbox ? ` (${ownMailbox})` : ''}`}
          </p>
          {isSuperAdmin && lastSync ? (
            <p className="text-xs text-muted-foreground mt-1">
              Last sync: {lastSync.status} · {formatDate(lastSync.started_at)}
              {lastSync.messages_upserted > 0 ? ` · ${lastSync.messages_upserted} messages` : ''}
            </p>
          ) : null}
        </div>
        {(isSuperAdmin || canWrite) ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setExtractOpen(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Extract Contacts
            </Button>
            {isSuperAdmin && <>
              <Button
                variant="outline"
                onClick={() => discoverMut.mutate()}
                disabled={discoverMut.isPending || !stats?.graph_configured}
              >
                {discoverMut.isPending ? 'Checking…' : 'Preview Azure users'}
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-600 border-red-500/40"
                disabled={purgeMut.isPending || !stats?.total}
                onClick={() => {
                  if (
                    confirm(
                      `Delete all ${stats?.total ?? 0} synced emails and reset mailboxes? This cannot be undone. You can sync again after.`,
                    )
                  ) {
                    purgeMut.mutate();
                  }
                }}
              >
                <Trash2 className={`w-4 h-4 mr-2 ${purgeMut.isPending ? 'animate-pulse' : ''}`} />
                {purgeMut.isPending ? 'Clearing…' : 'Clear all emails'}
              </Button>
              <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending || !stats?.graph_configured}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMut.isPending ? 'animate-spin' : ''}`} />
                {syncMut.isPending ? 'Syncing…' : 'Sync now'}
              </Button>
            </>}
          </div>
        ) : null}
      </div>

      {statsIsError ? (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="text-sm font-medium">Could not reach email API</p>
          <p className="text-sm text-muted-foreground mt-1">
            {(statsError as Error)?.message || 'Unknown error'}. Ensure the backend is running on{' '}
            <code className="text-xs">http://localhost:4000</code>.
          </p>
        </Card>
      ) : null}

      {isSuperAdmin && !statsIsError && stats && !stats.graph_configured ? (
        <Card className="p-4 border-amber-500/50 bg-amber-500/10">
          <p className="text-sm">
            Microsoft Graph is not configured on the backend. Add <code className="text-xs">MS_GRAPH_*</code> to{' '}
            <code className="text-xs">backend/.env</code> (local) or Render environment variables (production), then{' '}
            <strong>restart the backend</strong>.
          </p>
        </Card>
      ) : null}

      {stats?.db_error ? (
        <Card className="p-4 border-amber-500/50 bg-amber-500/10">
          <p className="text-sm">{stats.db_error}</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subject, sender, preview…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isSuperAdmin ? (
          <Select value={mailbox} onValueChange={setMailbox}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Mailbox" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All mailboxes</SelectItem>
              {mailboxes.map((m) => (
                <SelectItem key={m.id} value={m.email}>
                  {m.display_name || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="quotation">Quotation</SelectItem>
            <SelectItem value="followup">Follow-up</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
          </SelectContent>
        </Select>
        <Select value={linked} onValueChange={setLinked}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Linked" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Linked to CRM</SelectItem>
            <SelectItem value="false">Unlinked</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : emails.length === 0 ? (
        <Card className="p-10 text-center">
          <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">
            {hasActiveFilters ? 'No emails match your filters' : 'No emails synced yet'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'Try a different category or clear your filters.'
              : isSuperAdmin
                ? 'Click "Sync now" to pull mail from all company Outlook mailboxes.'
                : 'Your mailbox has not been synced yet. Ask a Super Admin to run email sync.'}
          </p>
          {hasActiveFilters ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setCategory('all');
                setLinked('all');
              }}
            >
              Clear filters
            </Button>
          ) : isSuperAdmin ? (
            <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
              Sync now
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <Card
              key={email.id}
              className={`p-4 cursor-pointer hover:bg-muted/40 transition-colors ${!email.is_read ? 'border-l-4 border-l-primary' : ''}`}
              onClick={() => setSelectedId(email.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {email.direction === 'outbound' ? (
                      <ArrowUpRight className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <p className="font-semibold truncate">{email.subject || '(No subject)'}</p>
                    {email.has_attachments ? (
                      <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {email.sender_name || email.sender_email || 'Unknown'} · {email.mailbox_email}
                  </p>
                  {email.body_preview ? (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{email.body_preview}</p>
                  ) : null}
                  <LinkBadges email={email} />
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{formatDate(email.received_at)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EmailDetailDialog emailId={selectedId} onClose={() => setSelectedId(null)} />

      <Dialog open={discoverOpen} onOpenChange={setDiscoverOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Azure AD mailbox preview</DialogTitle>
          </DialogHeader>
          {discoverMut.data ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {discoverMut.data.included} of {discoverMut.data.total} members will be synced. If someone is missing,
                check their Azure AD profile has a mailbox license.
              </p>
              <div className="divide-y divide-border border border-border rounded-lg max-h-96 overflow-y-auto">
                {discoverMut.data.data.map((row) => (
                  <div key={`${row.displayName}-${row.mailboxEmail}`} className="p-3 flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.displayName}</p>
                      <p className="text-muted-foreground text-xs">{row.mailboxEmail || '—'}</p>
                      {row.allEmails.length > 1 ? (
                        <p className="text-xs text-muted-foreground mt-0.5">Also: {row.allEmails.join(', ')}</p>
                      ) : null}
                    </div>
                    <Badge variant={row.included ? 'default' : 'secondary'}>
                      {row.included ? 'Will sync' : row.reason}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Click Preview Azure users to load the list.</p>
          )}
        </DialogContent>
      </Dialog>

      <ExtractContactsDialog open={extractOpen} onClose={() => setExtractOpen(false)} />
    </div>
  );
}
