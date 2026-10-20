import { Avatar } from '@/components/operations/bits';

const TABS = [
  ['inquiries', 'Inquiries'],
  ['activity', 'Activity'],
  ['register', 'Register'],
  ['agents', 'Agents'],
] as const;

export type OpsTab = (typeof TABS)[number][0];

export function PipelineHeader({
  tab,
  onTab,
  onNew,
  meName,
  isManager,
}: {
  tab: OpsTab;
  onTab: (tab: OpsTab) => void;
  onNew: () => void;
  meName?: string;
  isManager?: boolean;
}) {
  return (
    <div className="top">
      <div className="top-in">
        <div className="brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7h13l5 5v5h-3" />
            <path d="M3 7v10h3" />
            <circle cx="8" cy="17" r="2" />
            <circle cx="16" cy="17" r="2" />
            <path d="M10 17h4" />
          </svg>
          Operations Pipeline
        </div>
        <div className="tabs" role="tablist" id="tabs">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" className="tab" aria-selected={tab === id} onClick={() => onTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        {meName ? (
          <div className="me" id="meBox">
            <Avatar name={meName} size="s" />
            <span><b>{meName}</b></span>
            <span className="role">{isManager ? 'Manager' : 'Operations'}</span>
          </div>
        ) : null}
        {isManager ? (
          <button type="button" className="btn pri" id="newBtn" onClick={onNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New inquiry
          </button>
        ) : null}
      </div>
    </div>
  );
}
