import { Platform } from 'react-native';

export type CalendarResult = 'saved' | 'canceled' | 'denied' | 'unavailable';

interface EventInput {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  notes?: string;
}

/**
 * Opens the system "add event" form pre-filled with the plan.
 * expo-calendar is not in Expo Go, so it is loaded lazily and failures are reported, not thrown.
 */
export async function addToCalendar(input: EventInput): Promise<CalendarResult> {
  try {
    const Calendar = await import('expo-calendar');
    const { granted } = await Calendar.requestCalendarPermissions(true);
    if (!granted) return 'denied';

    let calendar;
    if (Platform.OS === 'ios') {
      calendar = Calendar.getDefaultCalendarSync();
    } else {
      const calendars = await Calendar.getCalendars();
      calendar = calendars.find((c) => c.allowsModifications) ?? calendars[0];
    }
    if (!calendar) return 'unavailable';

    const result = await calendar.addEventWithForm({
      title: input.title,
      startDate: input.start,
      endDate: input.end,
      location: input.location,
      notes: input.notes,
    });
    return result.action === 'canceled' ? 'canceled' : 'saved';
  } catch {
    return 'unavailable';
  }
}
