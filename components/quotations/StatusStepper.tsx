'use client';

import { Check, Send, Hourglass, Flag, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnquiryStage } from '@/types/quotations';
import { ENQUIRY_STAGE_LABELS, ENQUIRY_STAGES_ORDER } from '@/types/quotations';

function FutureStageIcon({ stage }: { stage: EnquiryStage }) {
  if (stage === 'follow_up') {
    return <Hourglass className="h-4 w-4 text-muted-foreground/80" strokeWidth={2} />;
  }
  if (stage === 'won_closed' || stage === 'lost_closed') {
    return <Flag className="h-4 w-4 text-muted-foreground/80" strokeWidth={2} />;
  }
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} />;
}

type Props = {
  current: EnquiryStage;
  disabled?: boolean;
  onStageChange?: (stage: EnquiryStage) => void;
};

export function StatusStepper({ current, disabled, onStageChange }: Props) {
  const activeIndex = Math.max(0, ENQUIRY_STAGES_ORDER.indexOf(current));

  return (
    <div className="w-full overflow-x-auto pb-1 pt-1">
      <div className="flex min-w-[840px] items-start justify-between gap-0 px-1">
        {ENQUIRY_STAGES_ORDER.map((stage, index) => {
          const completed = index < activeIndex;
          const active = index === activeIndex;
          const future = index > activeIndex;

          return (
            <div key={stage} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-[4.5rem] max-w-[6.5rem] shrink-0 flex-col items-center gap-2 px-0.5">
                <button
                  type="button"
                  disabled={disabled || !onStageChange}
                  onClick={() => onStageChange?.(stage)}
                  className={cn(
                    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
                    completed && 'border-emerald-500 bg-emerald-500 text-white shadow-sm',
                    active && 'border-blue-600 bg-blue-600 text-white shadow-md ring-4 ring-blue-600/15',
                    future && 'border-zinc-300 bg-white text-muted-foreground dark:border-zinc-600 dark:bg-zinc-900',
                    onStageChange && !disabled && 'cursor-pointer hover:opacity-90 active:scale-[0.98]',
                    (!onStageChange || disabled) && 'cursor-default',
                  )}
                  title={ENQUIRY_STAGE_LABELS[stage]}
                >
                  {completed ? <Check className="h-5 w-5" strokeWidth={2.5} /> : null}
                  {active ? <Send className="h-[18px] w-[18px]" strokeWidth={2} /> : null}
                  {future ? <FutureStageIcon stage={stage} /> : null}
                </button>
                <span
                  className={cn(
                    'text-center text-[10px] font-medium leading-snug sm:text-[11px]',
                    active ? 'text-blue-600 dark:text-blue-400' : completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
                  )}
                >
                  {ENQUIRY_STAGE_LABELS[stage]}
                </span>
              </div>
              {index < ENQUIRY_STAGES_ORDER.length - 1 ? (
                <div
                  className={cn(
                    'mt-[18px] h-0.5 min-w-[8px] flex-1 self-stretch max-w-full',
                    index < activeIndex ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700',
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
