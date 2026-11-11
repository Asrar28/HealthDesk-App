import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import type { RecurrenceType, LeadTime } from './types';

export function calculateNextOccurrence(
  fromDate: Date,
  recurrence: RecurrenceType
): Date | null {
  switch (recurrence) {
    case 'daily':
      return addDays(fromDate, 1);
    case 'weekly':
      return addWeeks(fromDate, 1);
    case 'monthly':
      return addMonths(fromDate, 1);
    case 'yearly':
      return addYears(fromDate, 1);
    default:
      return null;
  }
}

export function leadTimeToMinutes(leadTime: LeadTime): number {
  switch (leadTime) {
    case '15_min':
      return 15;
    case '1_hour':
      return 60;
    case '1_day':
      return 60 * 24;
    case '1_week':
      return 60 * 24 * 7;
    default:
      return 0;
  }
}

export function formatLeadTime(leadTime: LeadTime): string {
  switch (leadTime) {
    case 'at_time':
      return 'At time of event';
    case '15_min':
      return '15 minutes before';
    case '1_hour':
      return '1 hour before';
    case '1_day':
      return '1 day before';
    case '1_week':
      return '1 week before';
  }
}

export function formatRecurrence(recurrence: RecurrenceType): string {
  switch (recurrence) {
    case 'none':
      return 'One-time';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
  }
}
