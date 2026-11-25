const DAY = 24 * 3600 * 1000;

const pad = value => String(value).padStart(2, '0');
// Weekly calendar event in floating local time, starting at the next full day at 19:00.
export function reminderIcs(now = new Date(), url = 'https://hack-the-case-web-7ekw.onrender.com/') {
  const start = new Date(now.getTime() + DAY);
  const stamp = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T190000`;
  const created = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hack the Case//Weekly practice//RU', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:weekly-practice-${stamp}@hack-the-case`, `DTSTAMP:${created}`,
    `DTSTART:${stamp}`, 'DURATION:PT30M', 'RRULE:FREQ=WEEKLY',
    'SUMMARY:Hack the Case: занятие недели',
    `DESCRIPTION:Один собес или кейс. ${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hack the Case', 'TRIGGER:-PT10M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadReminder() {
  const blob = new Blob([reminderIcs()], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'hack-the-case-weekly.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// One-off calendar event for the skill re-check, at 19:00 local time on the due day.
export function reviewIcs(due, label, url = 'https://hack-the-case-web-7ekw.onrender.com/') {
  const date = new Date(due);
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T190000`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hack the Case//Skill check//RU',
    'BEGIN:VEVENT', `UID:skill-check-${stamp}@hack-the-case`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, 'DURATION:PT20M',
    `SUMMARY:Hack the Case: проверим навык «${label}»`, `DESCRIPTION:Один собес на этот навык. ${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hack the Case', 'TRIGGER:-PT10M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadFile(text, name) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
