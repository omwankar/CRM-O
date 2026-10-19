import { redirect } from 'next/navigation';

/** Pipeline opens as its own full-page tab at /operations. */
export default function OperationsDashboardRedirect() {
  redirect('/operations');
}
