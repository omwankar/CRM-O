'use client';

import { createPortal } from 'react-dom';
import { Avatar } from '@/components/operations/bits';
import { opsFontClass } from '@/components/operations/opsFonts';

export function TeamSettingsModal({
  open,
  onOpenChange,
  meName,
  team,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meName: string;
  team: Array<{ user_id: string; full_name: string }>;
}) {
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
            <p className="hint full" style={{ margin: 0 }}>Agent companies, contacts and emails are managed in the Agents tab.</p>
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
