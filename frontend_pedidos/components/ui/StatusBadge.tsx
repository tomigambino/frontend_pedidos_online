export function StatusBadge({
  isOpen,
  scheduleLabel,
}: {
  isOpen: boolean;
  scheduleLabel: string | null;
}) {
  return (
    <span
      className={`${
        isOpen
          ? 'bg-[var(--color-status-open)]'
          : 'bg-[var(--color-status-closed)]'
      } text-white px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider flex items-center gap-2`}
    >
      {isOpen && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
      {isOpen ? 'ABIERTO' : 'CERRADO'}
      {scheduleLabel ? ` • Hoy ${scheduleLabel}` : ' • Cerrado hoy'}
    </span>
  );
}
