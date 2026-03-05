import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/session';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) redirect('/dashboard');
  return <ForgotPasswordForm />;
}
