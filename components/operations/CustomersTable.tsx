'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteDirectoryCustomer, saveDirectoryCustomer, type DirectoryCustomer } from '@/lib/api/operations';

export function CustomersTable({ customers, onChanged }: { customers: DirectoryCustomer[]; onChanged: () => void }) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const saveMut = useMutation({
    mutationFn: () => saveDirectoryCustomer({ company_name: company.trim(), contact_name: contact.trim() || null, email: email.trim() || null, phone: phone.trim() || null }, editing || undefined),
    onSuccess: () => { setCompany(''); setContact(''); setPhone(''); setEmail(''); setEditing(null); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteDirectoryCustomer,
    onSuccess: () => onChanged(),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="vh">
        <div>
          <h2>Customers</h2>
          <p>Shared directory of customer companies. The count is how many inquiries they have given us. Customers added on a new inquiry are saved here too.</p>
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
          <input className="field" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Customer company" aria-label="Customer company" />
          <input className="field" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" aria-label="Contact person" />
          <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" aria-label="Customer email" />
          <input className="field" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+44 …" aria-label="Customer phone" />
          <button type="submit" className="btn pri" disabled={saveMut.isPending || company.trim().length < 2}>
            {editing ? 'Update customer' : 'Save customer'}
          </button>
        </form>
      </div>
      <div className="panel tbl-wrap">
        <table>
          <thead>
            <tr>
              {['Customer company', 'Contact person', 'Email', 'Phone', 'Inquiries', ''].map((heading) => (
                <th key={heading || 'actions'}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="hint" style={{ textAlign: 'center', padding: 24 }}>
                  No customers yet. Add one above, or create an inquiry with the company filled in.
                </td>
              </tr>
            ) : null}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td><b>{customer.company_name}</b></td>
                <td>{customer.contact_name || '—'}</td>
                <td className="mono">{customer.email || '—'}</td>
                <td className="mono">{customer.phone || '—'}</td>
                <td className="num">{customer.inquiries}</td>
                <td>
                  <div className="acts">
                    <button
                      type="button"
                      className="btn sm ghost"
                      onClick={() => {
                        setEditing(customer.id);
                        setCompany(customer.company_name);
                        setContact(customer.contact_name || '');
                        setPhone(customer.phone || '');
                        setEmail(customer.email || '');
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="btn sm ghost" onClick={() => deleteMut.mutate(customer.id)}>Remove</button>
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
