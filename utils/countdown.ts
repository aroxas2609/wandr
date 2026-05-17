import { getDaysUntil } from './dates';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isActive: boolean;
  label: string;
}

export function getCountdownParts(
  startDate: string,
  endDate: string
): CountdownParts {
  const daysUntilStart = getDaysUntil(startDate);
  const daysUntilEnd = getDaysUntil(endDate);

  if (daysUntilStart > 0) {
    return {
      days: daysUntilStart,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: false,
      isActive: false,
      label: daysUntilStart === 1 ? 'day until departure' : 'days until departure',
    };
  }

  if (daysUntilEnd >= 0) {
    return {
      days: daysUntilEnd + 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: false,
      isActive: true,
      label: daysUntilEnd === 0 ? 'last day of trip' : 'days remaining',
    };
  }

  return {
    days: Math.abs(daysUntilEnd),
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: true,
    isActive: false,
    label: 'days since trip ended',
  };
}

export function formatCountdownDisplay(parts: CountdownParts): string {
  if (parts.isPast) return `${parts.days}`;
  return `${parts.days}`;
}

/** Short label for hero / compact countdown */
export function getCountdownShortLabel(parts: CountdownParts): string {
  if (parts.isPast) return 'days ago';
  if (parts.isActive) return parts.days === 1 ? 'day left' : 'days left';
  return parts.days === 1 ? 'day to go' : 'days to go';
}
