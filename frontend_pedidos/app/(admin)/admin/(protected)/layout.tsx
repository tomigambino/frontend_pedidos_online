import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminSessionProvider } from '@/components/admin/AdminSessionProvider';
import { getMe } from '@/lib/api/auth';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  let session;
  try {
    session = await getMe(cookieStore.toString());
  } catch {
    redirect('/admin/login');
  }

  return (
    <AdminSessionProvider session={session}>
      <AdminNav />
      <div className="pb-16 md:pb-0">{children}</div>
    </AdminSessionProvider>
  );
}
