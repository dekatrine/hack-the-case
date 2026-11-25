import { expect, it } from 'vitest';
import { reminderIcs, reviewIcs } from './reminder.js';

const now = Date.UTC(2026, 10, 25, 12);

it('builds a weekly calendar event', () => {
  const ics = reminderIcs(new Date(now), 'https://example.test/');
  expect(ics).toContain('RRULE:FREQ=WEEKLY');
  expect(ics).toContain('BEGIN:VALARM');
  expect(ics).toMatch(/DTSTART:20261126T190000/);
  expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
});
it('builds a one-off skill check event on the due day', () => {
  const ics = reviewIcs(new Date(2026, 10, 28, 9).getTime(), 'Гипотезы', 'https://example.test/');
  expect(ics).toContain('DTSTART:20261128T190000');
  expect(ics).toContain('навык «Гипотезы»');
  expect(ics).not.toContain('RRULE');
});
