'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEnquiry, updateEnquiry } from '@/lib/api/enquiries';
import {
  addOperationsAgent,
  chooseOperationsBest,
  joinOperationsEnquiry,
  saveOperationsRate,
  type AgentSend,
  type PipelineInquiry,
} from '@/lib/api/operations';
import { formatUkDate } from '@/lib/date';

function ageLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day old';
  return `${days} days old`;
}

function SendRow({ send, mine, onChanged }: { send: AgentSend; mine: boolean; onChanged: () => void }) {
  const [price, setPrice] = useState(send.quoted_price != null ? String(send.quoted_price) : '');

  const rateMut = useMutation({
    mutationFn: () => saveOperationsRate(send.id, Number(price), send.currency),
    onSuccess: () => {
      toast.success('Rate saved');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const bestMut = useMutation({
    mutationFn: async () => {
      const amount = Number(price);
      if (!amount || Number.isNaN(amount)) throw new Error('Enter the rate');
      if (amount !== Number(send.quoted_price)) {
        await saveOperationsRate(send.id, amount, send.currency);
      }
      return chooseOperationsBest(send.id);
    },
    onSuccess: () => {
      toast.success('Best quote is now on the enquiry');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{send.agent_name}</p>
        <p className="text-[11px] text-slate-500">{send.user_name}</p>
      </div>
      {mine ? (
        <>
          <Input
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Rate"
            className="h-8 w-24"
          />
          <Button size="sm" variant="outline" className="h-8" disabled={rateMut.isPending || !price} onClick={() => rateMut.mutate()}>
            Save rate
          </Button>
          <Button size="sm" className="h-8" disabled={bestMut.isPending || !price} onClick={() => bestMut.mutate()}>
            {bestMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="mr-1 h-3.5 w-3.5" />}
            Best
          </Button>
        </>
      ) : (
        <span className="text-xs tabular-nums text-slate-600">
          {send.quoted_price != null ? `${send.currency || ''} ${Number(send.quoted_price).toLocaleString()}`.trim() : 'Waiting on rate'}
        </span>
      )}
      {send.is_best ? <span className="text-[10px] font-semibold uppercase text-emerald-700">Best</span> : null}
    </div>
  );
}

export function InquiryPanel({
  inquiry,
  userId,
  onChanged,
}: {
  inquiry: PipelineInquiry;
  userId?: string;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry', inquiry.id],
    queryFn: () => getEnquiry(inquiry.id),
  });

  const [customer, setCustomer] = useState('');
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [email, setEmail] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    if (!enquiry) return;
    setCustomer(enquiry.prospect_name || '');
    setTitle(enquiry.title || '');
    setRequirement(enquiry.requirement || '');
    setEmail(enquiry.client_email || '');
    setDeadline(enquiry.deadline ? enquiry.deadline.slice(0, 10) : '');
    setPriority(enquiry.priority || 'medium');
    setNotes(enquiry.notes || '');
  }, [enquiry]);

  const working = inquiry.operators.some((operator) => operator.user_id === userId);
  const bests = inquiry.sends.filter((send) => send.is_best && send.quoted_price != null);

  const saveMut = useMutation({
    mutationFn: () =>
      updateEnquiry(inquiry.id, {
        prospect_name: customer.trim() || null,
        title: title.trim() || null,
        requirement: requirement.trim(),
        client_email: email.trim() || null,
        deadline: deadline || null,
        priority,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Inquiry saved');
      qc.invalidateQueries({ queryKey: ['enquiry', inquiry.id] });
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const joinMut = useMutation({
    mutationFn: () => joinOperationsEnquiry(inquiry.id),
    onSuccess: () => {
      toast.success('You are working this enquiry');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const agentMut = useMutation({
    mutationFn: () => addOperationsAgent(inquiry.id, agentName.trim()),
    onSuccess: () => {
      setAgentName('');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !enquiry) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4 pr-12">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Inquiry</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-lg font-semibold">{inquiry.enquiry_number}</h2>
          <span className="text-xs font-medium text-amber-800">{ageLabel(inquiry.created_at)}</span>
          <span className="text-xs text-slate-400">{formatUkDate(inquiry.created_at)}</span>
        </div>
        <Link href={`/dashboard/enquiries/${inquiry.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
          Open the full enquiry
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (requirement.trim().length < 10) {
              toast.error('The shipment details need at least a short description');
              return;
            }
            saveMut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ops-customer">Customer</Label>
            <Input id="ops-customer" value={customer} onChange={(event) => setCustomer(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ops-title">Title</Label>
            <Input id="ops-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ops-requirement">Shipment</Label>
            <Textarea id="ops-requirement" value={requirement} onChange={(event) => setRequirement(event.target.value)} className="min-h-28" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ops-email">Email</Label>
              <Input id="ops-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ops-deadline">Deadline</Label>
              <Input id="ops-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ops-notes">Extra information</Label>
            <Textarea id="ops-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20" />
          </div>
          <Button type="submit" disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save inquiry
          </Button>
        </form>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Best quote</h3>
          {bests.length === 0 ? (
            <p className="text-sm text-muted-foreground">When quotes come back, choose the best one here.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {bests.map((send) => (
                <li key={send.id}>
                  {send.user_name}: {send.agent_name} · {send.currency || ''} {Number(send.quoted_price).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Agents and quotes</h3>
          <p className="text-xs text-muted-foreground">
            {inquiry.operators.length
              ? inquiry.operators.map((operator) => operator.full_name).join(', ')
              : 'Nobody working yet'}
          </p>
          {!working ? (
            <Button size="sm" variant="outline" disabled={joinMut.isPending} onClick={() => joinMut.mutate()}>
              Work on this
            </Button>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (agentName.trim().length < 2) return;
                agentMut.mutate();
              }}
            >
              <Input
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Agent company"
                className="h-8"
              />
              <Button type="submit" size="sm" className="h-8" disabled={agentMut.isPending || agentName.trim().length < 2}>
                Add agent
              </Button>
            </form>
          )}
          {inquiry.sends.length > 0 ? (
            <div className="divide-y rounded-md border px-3">
              {inquiry.sends.map((send) => (
                <SendRow key={send.id} send={send} mine={send.user_id === userId} onChanged={onChanged} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No agents contacted yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
