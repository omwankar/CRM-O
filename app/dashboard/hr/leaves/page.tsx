import { redirect } from 'next/navigation';

export default function HrLeavesRedirect() {
  redirect('/dashboard/hr/attendance');
}
