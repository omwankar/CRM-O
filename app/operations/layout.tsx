import type { Metadata } from 'next';
import { opsFontClass } from '@/components/operations/opsFonts';
import '@/components/operations/operations.css';
import '@/components/operations/operations-polish.css';

export const metadata: Metadata = {
  title: 'Operations Pipeline',
};

export default function OperationsStandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${opsFontClass} ops-standalone`}>
      {children}
    </div>
  );
}
