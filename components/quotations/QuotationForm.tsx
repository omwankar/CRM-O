'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QUOTATION_STATUS_LABELS, type Quotation, type QuotationStatus } from '@/types/quotations';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getUsers } from '@/lib/api/users';
import { getProjects } from '@/lib/api/projects';

const schema = z.object({
  requirement: z.string().min(10, 'Requirement must be at least 10 characters'),
  status: z.custom<QuotationStatus>(),
  deadline: z.string().optional(),
  enquiry_lead: z.string().optional(),
  mode: z.enum(['project', 'standalone']),
  project_id: z.string().optional(),
  client_budget: z.coerce.number().optional(),
  client_currency: z.string().optional(),
  client_price_notes: z.string().optional(),
}).refine((v) => v.mode !== 'standalone' || (v.client_budget != null && !Number.isNaN(v.client_budget)), {
  path: ['client_budget'],
  message: 'Client budget is required for standalone quotations',
});

type FormValues = z.infer<typeof schema>;

export function QuotationForm({
  quotation,
  onSuccess,
}: {
  quotation?: Quotation;
  onSuccess: () => void;
}) {
  const { user } = useCurrentUser();
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);
  const [projects, setProjectsList] = useState<Array<{ id: string; project_name: string; project_id: string }>>([]);

  const defaultValues: FormValues = useMemo(() => {
    const isProject = !!quotation?.project_id;
    return {
      requirement: quotation?.requirement || '',
      status: (quotation?.status || 'waiting_from_companies') as QuotationStatus,
      deadline: quotation?.deadline || '',
      enquiry_lead: quotation?.enquiry_lead || '',
      mode: isProject ? 'project' : 'standalone',
      project_id: quotation?.project_id || '',
      client_budget: quotation?.client_budget ?? undefined,
      client_currency: quotation?.client_currency || 'INR',
      client_price_notes: quotation?.client_price_notes || '',
    };
  }, [quotation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const mode = form.watch('mode');

  const loadUsers = async () => {
    const res = await getUsers({ limit: 200 });
    setUsers(res.data || []);
  };

  const loadProjects = async () => {
    const res = await getProjects({ limit: 50 });
    setProjectsList(res.projects || []);
  };

  // Lazy load when field is focused (keeps this component lightweight)
  const ensureLoaded = async () => {
    if (users.length === 0) await loadUsers();
    if (projects.length === 0) await loadProjects();
  };

  const submit = async (values: FormValues) => {
    if (!user?.id) throw new Error('Not authenticated');
    const payload = {
      requirement: values.requirement,
      status: values.status,
      deadline: values.deadline || undefined,
      enquiry_lead: values.enquiry_lead || undefined,
      project_id: values.mode === 'project' ? values.project_id || undefined : undefined,
      client_budget: values.mode === 'standalone' ? values.client_budget : undefined,
      client_currency: values.mode === 'standalone' ? values.client_currency || 'INR' : undefined,
      client_price_notes: values.mode === 'standalone' ? values.client_price_notes || undefined : undefined,
    };

    if (quotation?.id) {
      const { updateQuotation } = await import('@/lib/api/quotations');
      await updateQuotation(quotation.id, payload);
    } else {
      const { createQuotation } = await import('@/lib/api/quotations');
      await createQuotation(payload);
    }

    onSuccess();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await submit(v);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            alert('Failed to save quotation. Please try again.');
          }
        })}
        className="space-y-6"
      >
        <Card className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Basic Info</h2>
            <p className="text-sm text-muted-foreground">Requirement, status and owner</p>
          </div>

          <FormField
            control={form.control}
            name="requirement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirement</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Describe the requirement..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(QUOTATION_STATUS_LABELS) as QuotationStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {QUOTATION_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enquiry_lead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enquiry Lead</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      value={field.value || ''}
                      onFocus={ensureLoaded}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    >
                      <option value="">Select user...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Linked Project</h2>
            <p className="text-sm text-muted-foreground">Choose project or enter client budget</p>
          </div>

          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`h-9 rounded-full border px-3 text-sm ${field.value === 'project' ? 'bg-muted' : 'bg-background'}`}
                    onClick={() => field.onChange('project')}
                  >
                    Part of a Project
                  </button>
                  <button
                    type="button"
                    className={`h-9 rounded-full border px-3 text-sm ${field.value === 'standalone' ? 'bg-muted' : 'bg-background'}`}
                    onClick={() => field.onChange('standalone')}
                  >
                    Standalone Quotation
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'project' ? (
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      value={field.value || ''}
                      onFocus={ensureLoaded}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    >
                      <option value="">Select project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.project_name} ({p.project_id})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="client_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Budget</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value == null ? '' : String(field.value)}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value || 'INR'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['INR', 'USD', 'EUR', 'AED'].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_price_notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Client Price Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {quotation ? 'Save Changes' : 'Create Quotation'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

