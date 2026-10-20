import { opsFontClass } from '@/components/operations/opsFonts';
import '@/components/operations/operations.css';
import '@/components/operations/operations-polish.css';

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <div className={opsFontClass}>{children}</div>;
}
