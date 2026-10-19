'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteDirectoryAgent, saveDirectoryAgent, type DirectoryAgent } from '@/lib/api/operations';

export function AgentsTable({ agents, onChanged }: { agents: DirectoryAgent[]; onChanged: () => void }) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const saveMut = useMutation({
    mutationFn: () => saveDirectoryAgent({ company_name: company.trim(), contact_name: contact.trim() || null, email: email.trim() || null, phone: phone.trim() || null }, editing || undefined),
    onSuccess: () => { setCompany(''); setContact(''); setPhone(''); setEmail(''); setEditing(null); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteDirectoryAgent,
    onSuccess: () => onChanged(),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="vh">
        <div>
          <h2>Agents</h2>
          <p>Shared directory of agent companies with their contact person, email and phone. Agents added on an inquiry are saved here too.</p>
        </div>
      </div>
      <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
        <form
          className="agform"
          onSubmit={(event) => {
            event.preventDefault();
            if (company.trim().length >= 2) saveMut.mutate();
          }}
        >
          <input className="field" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Agent company" aria-label="Agent company" />
          <input className="field" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" aria-label="Contact person" />
          <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Email" />
          <input className="field" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" aria-label="Phone" />
          <button type="submit" className="btn pri" disabled={saveMut.isPending || company.trim().length < 2}>
            {editing ? 'Update agent' : 'Save agent'}
          </button>
        </form>
      </div>
      <div className="panel tbl-wrap">
        <table>
          <thead>
            <tr>
              {['Company', 'Contact person', 'Email', 'Phone', 'Requests', 'Rates', 'Chosen best', ''].map((heading) => (
                <th key={heading || 'actions'}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={8} className="hint" style={{ textAlign: 'center', padding: 24 }}>
                  No agents yet. Add your first agent above, or add one on an inquiry.
                </td>
              </tr>
            ) : null}
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td><b>{agent.company_name}</b></td>
                <td>{agent.contact_name || '—'}</td>
                <td className="mono">{agent.email || '—'}</td>
                <td className="mono">{agent.phone || '—'}</td>
                <td className="num">{agent.requests}</td>
                <td className="num">{agent.rates}</td>
                <td className="num">{agent.chosen}</td>
                <td>
                  <div className="acts">
                    <button
                      type="button"
                      className="btn sm ghost"
                      onClick={() => {
                        setEditing(agent.id);
                        setCompany(agent.company_name);
                        setContact(agent.contact_name || '');
                        setPhone(agent.phone || '');
                        setEmail(agent.email || '');
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="btn sm ghost" onClick={() => deleteMut.mutate(agent.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
