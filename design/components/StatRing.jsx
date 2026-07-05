import React from 'react';

/*
 * StatRing — circular progress ring for a weekly/monthly goal (e.g. cases
 * solved this week, lessons streak). `face="clean"` (default, only face):
 * thin gray track, solid black progress arc, big number centered, small
 * caption below. Modeled on Plata's circular spend-breakdown ring — makes
 * a goal read as "how full is this week" rather than a bare fraction.
 */
export function StatRing({ value = 0, max = 100, size = 96, strokeWidth = 8, label, sublabel, tone = 'ink' }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;
  const stroke = tone === 'accent' ? 'var(--accent-primary)' : 'var(--c-black)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--c-gray-200)" strokeWidth={strokeWidth} />
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray var(--dur-medium) var(--ease-emphasized)' }}
        />
      </svg>
      {(label || sublabel) && (
        <div>
          {label && <div style={{ fontFamily: 'var(--font-display-clean)', fontWeight: 700, fontSize: 22, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>{label}</div>}
          {sublabel && <div style={{ fontFamily: 'var(--font-label-clean)', fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, marginTop: 2 }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
