'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar } from '@/components/operations/bits';
import { opsFontClass } from '@/components/operations/opsFonts';
import { clearOperationsPipeline } from '@/lib/api/operations';

export function TeamSettingsModal({
  open,
  onOpenChange,
  meName,
  team,
  onCleared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meName: string;
  team: Array<{ user_id: string; full_name: string }>;
  onCleared?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const clearMut = useMutation({
    mutationFn: clearOperationsPipeline,
    onSuccess: (result) => {
      toast.success(`Removed ${result.deleted} pipeline inquir${result.deleted === 1 ? 'y' : 'ies'}. CRM enquiries outside this module were left alone.`);
      setConfirm(false);
      onCleared?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className={`${opsFontClass} ops`}>
      <div className="scrim" data-scrim="1" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
        <form className="modal" onSubmit={(event) => { event.preventDefault(); onOpenChange(false); }}>
          <header>
            <h2>Team &amp; settings</h2>
            <button className="btn ghost sm" type="button" onClick={() => onOpenChange(false)}>Close</button>
          </header>
          <div className="mbody">
            <label className="full" htmlFor="s-mgr">
              Your name (manager)
              <input className="field" id="s-mgr" value={meName} readOnly />
            </label>
            <div className="full">
              <div className="lbl" style={{ marginBottom: 6 }}>Operations team</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {team.map((person) => (
                  <div key={person.user_id} className="mrow">
                    <span className="tchip" style={{ justifySelf: 'start' }}>
                      <Avatar name={person.full_name} size="s" />
                      {person.full_name}
                    </span>
                    <span />
                    <span className="hint">CRM login linked</span>
                  </div>
                ))}
              </div>
              <p className="hint" style={{ margin: '8px 0 0' }}>
                These names are used when you assign inquiries and record who sent to which agent. Add or remove people by setting them as Operations in CRM users.
              </p>
            </div>
            <p className="hint full" style={{ margin: 0 }}>Agent companies and customers are managed in the Agents and Customers tabs.</p>
            <div className="full closebox crit">
              <div className="lbl">Clear this module</div>
              <p className="hint" style={{ margin: '6px 0 10px' }}>Deletes every inquiry on the Operations Pipeline only. Enquiries in the rest of CRM are not removed.</p>
              {confirm ? (
                <div className="acts">
                  <button className="btn sm" type="button" onClick={() => setConfirm(false)}>Keep them</button>
                  <button className="btn sm delyes" type="button" disabled={clearMut.isPending} onClick={() => clearMut.mutate()}>
                    {clearMut.isPending ? 'Deleting…' : 'Delete pipeline inquiries'}
                  </button>
                </div>
              ) : (
                <button className="btn sm danger" type="button" onClick={() => setConfirm(true)}>Delete pipeline data</button>
              )}
            </div>
          </div>
          <div className="mfoot">
            <span className="msg" />
            <button className="btn" type="button" onClick={() => onOpenChange(false)}>Cancel</button>
            <button className="btn pri" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
