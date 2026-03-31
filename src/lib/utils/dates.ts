import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isToday as dfIsToday,
  isThisMonth as dfIsThisMonth,
} from 'date-fns';

export function formatDate(date: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(date), fmt);
  } catch {
    return date;
  }
}

export function getMonthRange(date: Date = new Date()): {
  from: Date;
  to: Date;
} {
  return {
    from: startOfMonth(date),
    to: endOfMonth(date),
  };
}

export function getDateRangeLabel(from: string, to: string): string {
  try {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    if (format(fromDate, 'yyyy-MM') === format(toDate, 'yyyy-MM')) {
      return format(fromDate, 'MMMM yyyy');
    }
    return `${format(fromDate, 'MMM d')} – ${format(toDate, 'MMM d, yyyy')}`;
  } catch {
    return `${from} – ${to}`;
  }
}

export function isToday(date: string): boolean {
  try {
    return dfIsToday(parseISO(date));
  } catch {
    return false;
  }
}

export function isThisMonth(date: string): boolean {
  try {
    return dfIsThisMonth(parseISO(date));
  } catch {
    return false;
  }
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getCurrentMonthKey(): string {
  return format(new Date(), 'yyyy-MM');
}
