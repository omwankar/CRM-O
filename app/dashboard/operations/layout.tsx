import { opsFontClass } from '@/components/operations/opsFonts';
import '@/components/operations/operations.css';

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${opsFontClass} flex h-full min-h-0 flex-col`}>{children}</div>;
}
