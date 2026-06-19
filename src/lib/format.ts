import { Lang } from '@/types/content';

/** Format an ISO date string for the given language (falls back to the raw string). */
export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
