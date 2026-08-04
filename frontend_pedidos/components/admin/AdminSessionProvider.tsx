'use client';

import { createContext, useContext } from 'react';
import type { AdminSession } from '@/lib/api/auth';

const AdminSessionContext = createContext<AdminSession | null>(null);

export function AdminSessionProvider({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  return (
    <AdminSessionContext.Provider value={session}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error('useAdminSession debe usarse dentro de AdminSessionProvider');
  return ctx;
}
