'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/api/auth';

export default function LoginAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] flex flex-col gap-8">
          <div className="text-center">
            <Image
              src="/logo.webp"
              alt="Logo de la plataforma"
              width={120}
              height={120}
              className="inline-block object-contain mb-6"
            />
            <h2 className="text-4xl font-extrabold text-foreground mb-2">Pedilo</h2>
            <p className="text-lg text-muted">Gestión de Locales y Pedidos</p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-xl shadow-md border border-black/5">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold tracking-wider text-foreground/70"
                >
                  Email Corporativo
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tusitio.com"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-black/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold tracking-wider text-foreground/70"
                  >
                    Contraseña
                  </label>
                  <a
                    href="#"
                    className="text-sm font-semibold text-primary hover:underline transition-all"
                  >
                    ¿Olvidaste la clave?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-black/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">
                      progress_activity
                    </span>
                    Cargando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-base text-muted">
              ¿No tienes una cuenta de administrador?{' '}
              <a href="#" className="text-primary font-semibold hover:underline">
                Solicitar acceso
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-4 py-8">
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
            Privacidad
          </a>
          <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
            Términos
          </a>
          <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
            Centro de Ayuda
          </a>
        </div>
        <p className="text-sm text-muted">© 2026 Pedilo. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
