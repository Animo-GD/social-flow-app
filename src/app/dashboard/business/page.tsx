import { redirect } from 'next/navigation';
export default function BusinessPage() {
  redirect('/dashboard/profile?tab=business');
}
