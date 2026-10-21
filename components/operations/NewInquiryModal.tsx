'use client';

import { createPortal } from 'react-dom';
import { InquiryIntake } from '@/components/operations/InquiryIntake';
import { opsFontClass } from '@/components/operations/opsFonts';

export function NewInquiryModal({
  open,
  onOpenChange,
  onCreated,
  team,
  existingIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  team: Array<{ user_id: string; full_name: string }>;
  existingIds: string[];
}) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className={`${opsFontClass} ops`}>
      <div
        className="scrim"
        data-scrim="1"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <InquiryIntake
          team={team}
          existingIds={existingIds}
          onCancel={() => onOpenChange(false)}
          onCreated={() => {
            onCreated();
            onOpenChange(false);
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
