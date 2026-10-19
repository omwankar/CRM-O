import type { Metadata } from 'next';
import { opsFontClass } from '@/components/operations/opsFonts';
import '@/components/operations/operations.css';

export const metadata: Metadata = {
  title: 'Operations Pipeline',
};

export default function OperationsStandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${opsFontClass} ops-standalone h-svh min-h-0 w-screen overflow-hidden`} style={{ background: '#FFF8DC' }}>
      {children}
    </div>
  );
}
