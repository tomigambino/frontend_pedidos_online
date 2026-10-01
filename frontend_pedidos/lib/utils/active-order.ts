const ACTIVE_ORDER_PREFIX = 'pedido_activo_';

export function activeOrderKey(slug: string): string {
  return `${ACTIVE_ORDER_PREFIX}${slug}`;
}

export function readActiveOrder(slug: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(activeOrderKey(slug));
  } catch {
    // localStorage bloqueado — se trata como sin pedido activo
    return null;
  }
}

export function writeActiveOrder(slug: string, trackingUuid: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(activeOrderKey(slug), trackingUuid);
  } catch {
    // no se pudo persistir — el tracking queda solo en la URL
  }
}

export function clearActiveOrder(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(activeOrderKey(slug));
  } catch {
    // storage bloqueado — no hay nada que limpiar
  }
}