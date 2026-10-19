import type { Metadata } from 'next';
import '@/components/operations/operations.css';

export const metadata: Metadata = {
  title: 'Operations Pipeline',
};

export default function OperationsStandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ops-standalone h-svh min-h-0 w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
