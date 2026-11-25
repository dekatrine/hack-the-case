const DAY = 24 * 3600 * 1000;

// Whole days since the latest attempt; null when there are none.
export function daysSinceLast(attempts, now = Date.now()) {
  if (!attempts.length) return null;
  const last = Math.max(...attempts.map(item => item.at));
  return Math.max(0, Math.floor((now - last) / DAY));
}

// A calm nudge that never talks about losing progress.
export function nudge(attempts, now = Date.now()) {
  const days = daysSinceLast(attempts, now);
  if (days === null || days < 5) return null;
  return days >= 14
    ? 'Давно не занимались. Хватит одного короткого собеса, чтобы вернуться в ритм.'
    : `Последнее занятие было ${days} дн. назад. Одно занятие на этой неделе сохранит ритм.`;
}

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
