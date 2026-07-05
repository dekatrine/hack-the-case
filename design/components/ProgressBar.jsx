import React from 'react';

/*
 * ProgressBar — linear progress indicator. `face="clean"` (DEFAULT) is a
 * thin flat track (light gray) filled solid black — used for level/XP
 * progress and lesson completion in the current live product.
 */
export function ProgressBar({ value = 0, face = 'clean', tone = 'coral', size = 'md' }) {
  const pct = Math.max(0, Math.min(100, value));
  const isQuest = face === 'quest';
  const isClean = face === 'clean';
  const fillColor = isClean
    ? 'var(--c-black)'
    : isQuest
    ? { coral: 'var(--q-coral)', mint: 'var(--q-mint)', plum: 'var(--q-plum)' }[tone] || 'var(--q-coral)'
    : 'var(--accent-primary)';

  const track = isClean
    ? { height: size === 'lg' ? 8 : 5, borderRadius: 'var(--r-pill)', background: 'var(--c-gray-200)', overflow: 'hidden' }
    : isQuest
    ? {
        height: size === 'lg' ? 14 : 10,
        borderRadius: 'var(--r-pill)',
        background: 'var(--q-card-sunk)',
        border: 'var(--q-border-thin)',
        overflow: 'hidden',
      }
    : {
        height: 6,
        borderRadius: 'var(--r-pill)',
        background: 'var(--border-hairline)',
        overflow: 'hidden',
      };

  return (
    <div style={track}>
      <div style={{ height: '100%', width: `${pct}%`, background: fillColor, borderRadius: 'inherit', transition: `width var(--dur-medium) var(--ease-emphasized)` }} />
    </div>
  );
}
