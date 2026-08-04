'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: 'receipt_long' },
  { href: '/admin/productos', label: 'Menú', icon: 'menu_book' },
  { href: '/admin/configuracion', label: 'Configuración', icon: 'settings' },
];

export function AdminNav() {
  const pathname = usePathname();
  const { email, tenantName } = useAdminSession();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-black/5 shadow-sm">
        <div className="w-full h-16 px-4 md:px-8 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo.webp"
              alt="Logo de la plataforma"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight leading-none text-foreground">
              {tenantName}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold tracking-wider transition-colors ${
                    active ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="h-8 w-px bg-black/10"></div>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold tracking-wider text-foreground"
              aria-label="Administrador"
            >
              <span className="material-symbols-outlined text-2xl text-muted">account_circle</span>
              <span className="hidden lg:inline">{email}</span>
            </button>
          </nav>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/5 md:hidden">
        <div className="grid grid-cols-4">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 py-2 text-xs font-semibold text-center px-1 transition-colors ${
                  active ? 'text-primary' : 'text-muted'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
