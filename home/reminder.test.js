import { expect, it } from 'vitest';
import { daysSinceLast, nudge, reminderIcs } from './reminder.js';

const day = 24 * 3600 * 1000;
const now = Date.UTC(2026, 10, 25, 12);

it('stays silent for new users and for recent practice', () => {
  expect(daysSinceLast([], now)).toBeNull();
  expect(nudge([], now)).toBeNull();
  expect(nudge([{ at: now - 2 * day }], now)).toBeNull();
});
it('nudges calmly after five days and again after two weeks', () => {
  expect(nudge([{ at: now - 6 * day }, { at: now - 30 * day }], now)).toContain('6 дн. назад');
  expect(nudge([{ at: now - 20 * day }], now)).toContain('Давно не занимались');
  expect(nudge([{ at: now - 6 * day }], now)).not.toMatch(/потер|сброс|серия/i);
});
it('builds a weekly calendar event', () => {
  const ics = reminderIcs(new Date(now), 'https://example.test/');
  expect(ics).toContain('RRULE:FREQ=WEEKLY');
  expect(ics).toContain('BEGIN:VALARM');
  expect(ics).toMatch(/DTSTART:20261126T190000/);
  expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
});
