import { getZonedDateKey } from '@/lib/utils/schedule';

export function today(): string {
  return getZonedDateKey();
}
