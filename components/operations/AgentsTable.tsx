'use client';

import { Fragment, useMemo, useState } from 'react';
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

  const groups = useMemo(() => {
    const map = new Map<string, DirectoryAgent[]>();
    for (const agent of agents) {
      const key = agent.company_name.trim().toLowerCase();
      const list = map.get(key) || [];
      list.push(agent);
      map.set(key, list);
    }
    return [...map.values()];
  }, [agents]);

  return (
    <div>
      <div className="vh">
        <div>
          <h2>Agents</h2>
          <p>Shared directory of agent companies. Use the same company name to add another contact person, email and phone.</p>
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
          <input className="field" list="ops-dir-companies" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Agent company" aria-label="Agent company" />
          <datalist id="ops-dir-companies">{[...new Set(agents.map((agent) => agent.company_name))].map((name) => <option key={name} value={name} />)}</datalist>
          <input className="field" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" aria-label="Contact person" />
          <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Email" />
          <input className="field" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" aria-label="Phone" />
          <button type="submit" className="btn pri" disabled={saveMut.isPending || company.trim().length < 2}>
            {editing ? 'Update contact' : 'Save contact'}
          </button>
        </form>
        <p className="hint" style={{ margin: '8px 0 0' }}>Saving again with the same company and a different name adds another person at that agent.</p>
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
            {groups.length === 0 ? (
              <tr>
                <td colSpan={8} className="hint" style={{ textAlign: 'center', padding: 24 }}>
                  No agents yet. Add your first agent above, or add one on an inquiry.
                </td>
              </tr>
            ) : null}
            {groups.map((contacts) => contacts.map((agent, index) => (
              <Fragment key={agent.id}>
                <tr>
                  <td>{index === 0 ? <b>{agent.company_name}</b> : <span className="hint">{agent.company_name}</span>}</td>
                  <td>{agent.contact_name || '—'}</td>
                  <td className="mono">{agent.email || '—'}</td>
                  <td className="mono">{agent.phone || '—'}</td>
                  <td className="num">{index === 0 ? agent.requests : ''}</td>
                  <td className="num">{index === 0 ? agent.rates : ''}</td>
                  <td className="num">{index === 0 ? agent.chosen : ''}</td>
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
              </Fragment>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
