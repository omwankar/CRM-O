'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
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
import {
  ENQUIRY_STAGE_LABELS,
  ENQUIRY_STAGES_ORDER,
  normalizeEnquiryStage,
  buildOutcomeString,
  closureKindToCrmStatus,
  isTerminalEnquiryStage,
  closureKindForEnquiryStage,
  QUOTATION_CURRENCIES,
  type ClosureKind,
  type EnquiryStage,
  type Quotation,
  type QuotationStatus,
} from '@/types/quotations';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getUsers } from '@/lib/api/users';
import { getProjects } from '@/lib/api/projects';
import { notifyQuotationError } from '@/lib/quotation-notify';

const enquiryStageSchema = z.enum(
  ENQUIRY_STAGES_ORDER as [EnquiryStage, EnquiryStage, ...EnquiryStage[]],
);

const schema = z.object({
  requirement: z.string().min(10, 'Requirement must be at least 10 characters'),
  enquiry_stage: enquiryStageSchema,
  deadline: z.string().optional(),
  enquiry_lead: z.string().optional(),
  mode: z.enum(['project', 'standalone']),
  project_id: z.string().optional(),
  standalone_project_name: z.string().optional(),
  client_budget: z.coerce.number().optional(),
  client_currency: z.string().optional(),
  client_price_notes: z.string().optional(),
  closure_kind: z.enum(['won', 'lost', 'closed']).optional(),
  closure_detail: z.string().optional(),
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
  const qc = useQueryClient();
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);
  const [projects, setProjectsList] = useState<Array<{ id: string; project_name: string; project_id: string }>>([]);

  const defaultValues: FormValues = useMemo(() => {
    const isProject = !!quotation?.project_id;
    return {
      requirement: quotation?.requirement || '',
      enquiry_stage: quotation ? normalizeEnquiryStage(quotation) : 'new_enquiry',
      deadline: quotation?.deadline || '',
      enquiry_lead: quotation?.enquiry_lead || '',
      mode: isProject ? 'project' : 'standalone',
      project_id: quotation?.project_id || '',
      standalone_project_name: quotation?.standalone_project_name || '',
      client_budget: quotation?.client_budget ?? undefined,
      client_currency: quotation?.client_currency || 'INR',
      client_price_notes: quotation?.client_price_notes || '',
      closure_kind: undefined as ClosureKind | undefined,
      closure_detail: '',
    };
  }, [quotation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const mode = form.watch('mode');
  const enquiryStageWatch = form.watch('enquiry_stage');

  const loadUsers = async () => {
    try {
      const res = await getUsers({ limit: 200 });
      setUsers(res.data || []);
    } catch (error) {
      notifyQuotationError(error, 'Could not load users.');
    }
  };

  const loadProjects = async () => {
    try {
      const res = await getProjects({ limit: 50 });
      setProjectsList(res.projects || []);
    } catch (error) {
      notifyQuotationError(error, 'Could not load projects.');
    }
  };

  // Lazy load when field is focused (keeps this component lightweight)
  const ensureLoaded = async () => {
    if (users.length === 0) await loadUsers();
    if (projects.length === 0) await loadProjects();
  };

  const submit = async (values: FormValues) => {
    if (!user?.id) throw new Error('Not authenticated');
    const closingFresh =
      isTerminalEnquiryStage(values.enquiry_stage) &&
      (!quotation?.id || !isTerminalEnquiryStage(normalizeEnquiryStage(quotation)));

    const payload: Record<string, unknown> = {
      requirement: values.requirement,
      enquiry_stage: values.enquiry_stage,
      deadline: values.deadline || undefined,
      enquiry_lead: values.enquiry_lead || undefined,
      project_id: values.mode === 'project' ? values.project_id || undefined : undefined,
      standalone_project_name:
        values.mode === 'standalone' ? values.standalone_project_name?.trim() || undefined : undefined,
      client_budget: values.mode === 'standalone' ? values.client_budget : undefined,
      client_currency: values.mode === 'standalone' ? values.client_currency || 'INR' : undefined,
      client_price_notes: values.mode === 'standalone' ? values.client_price_notes || undefined : undefined,
    };

    if (closingFresh) {
      const kind = closureKindForEnquiryStage(values.enquiry_stage);
      if (!kind) {
        notifyQuotationError('Choose Won & Closed or Lost & Closed for the enquiry stage.');
        return;
      }
      payload.outcome = buildOutcomeString(kind, values.closure_detail);
      payload.status = closureKindToCrmStatus(kind);
    }

    delete payload.closure_kind;
    delete payload.closure_detail;

    if (quotation?.id) {
      const { updateQuotation } = await import('@/lib/api/quotations');
      await updateQuotation(quotation.id, payload as never);
      await qc.invalidateQueries({ queryKey: ['quotations'] });
      await qc.invalidateQueries({ queryKey: ['quotation-stats'] });
      await qc.invalidateQueries({ queryKey: ['quotation', quotation.id] });
    } else {
      const { createQuotation } = await import('@/lib/api/quotations');
      const CRM_DEFAULT: QuotationStatus = 'waiting_from_companies';
      const status = (payload.status as QuotationStatus | undefined) || CRM_DEFAULT;
      await createQuotation({ ...payload, status } as never);
      await qc.invalidateQueries({ queryKey: ['quotations'] });
      await qc.invalidateQueries({ queryKey: ['quotation-stats'] });
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
            notifyQuotationError(e, 'Failed to save quotation. Please try again.');
          }
        })}
        className="space-y-6"
      >
        <Card className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Basic Info</h2>
            <p className="text-sm text-muted-foreground">Requirement, enquiry workflow stage, and owner</p>
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

          {mode === 'standalone' && (
            <FormField
              control={form.control}
              name="standalone_project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. company or site name" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Shown on the quotation tracker and list cards. Required for standalone enquiries if you want it to appear in search.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === 'project' && (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
              Customer name on the tracker comes from the <span className="font-medium text-foreground">project</span> you select below.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="enquiry_stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enquiry stage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[120]">
                      {ENQUIRY_STAGES_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {ENQUIRY_STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Same workflow as the quotation tracker stepper.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isTerminalEnquiryStage(enquiryStageWatch) &&
            (!quotation?.id || !isTerminalEnquiryStage(normalizeEnquiryStage(quotation))) ? (
              <div className="md:col-span-2 space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-foreground">
                  Closing outcome: {ENQUIRY_STAGE_LABELS[enquiryStageWatch]}
                </p>
                <FormField
                  control={form.control}
                  name="closure_detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Details (optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="e.g. PO number, reason…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

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
                        {QUOTATION_CURRENCIES.map((c) => (
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

