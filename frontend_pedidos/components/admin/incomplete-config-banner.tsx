export function IncompleteConfigBanner({ missingSections }: { missingSections: string[] }) {
  if (missingSections.length === 0) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-amber-800 shadow-md">
      <span className="material-symbols-outlined text-base shrink-0">info</span>
      <span>
        Te falta completar <strong>{missingSections.length}</strong>{' '}
        {missingSections.length === 1 ? 'sección' : 'secciones'}
      </span>
    </div>
  );
}