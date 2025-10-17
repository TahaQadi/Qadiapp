import { format, formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

/**
 * Format a date according to the current language
 * @param date - Date to format
 * @param language - Current language ('en' | 'ar')
 * @param formatString - Optional format string (defaults to 'PP' - localized date)
 * @returns Formatted date string
 */
export function formatDateLocalized(
  date: Date | string,
  language: 'en' | 'ar',
  formatString: string = 'PP'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString, { 
    locale: language === 'ar' ? ar : enUS 
  });
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param date - Date to format
 * @param language - Current language ('en' | 'ar')
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string,
  language: 'en' | 'ar'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });
}
