import React from 'react';

/*
 * Chip — small pill label. `face="clean"` (DEFAULT) covers both looks seen
 * in the live product: a soft lime tag ("КОНСАЛТИНГ") and a plain gray
 * uppercase meta label (framework/industry tags) — pick via `tone`.
 */
export function Chip({ children, tone = 'neutral', face = 'clean', solid = false }) {
  const isQuest = face === 'quest';
  const isClean = face === 'clean';
  const questTones = {
    neutral: { background: 'var(--q-card)' },
    coral: { background: solid ? 'var(--q-coral)' : 'var(--q-coral-2)', color: solid ? '#fff' : 'var(--q-ink)' },
    plum: { background: solid ? 'var(--q-plum)' : 'var(--q-plum-2)', color: solid ? '#fff' : 'var(--q-ink)' },
    mint: { background: 'var(--q-mint-2)' },
    sun: { background: 'var(--q-sun-2)' },
    sky: { background: 'var(--q-sky-2)' },
    pink: { background: 'var(--q-pink-2)' },
    ink: { background: 'var(--q-ink)', color: '#fff' },
  };
  const editorialTones = {
    neutral: { color: 'var(--text-secondary)', borderColor: 'var(--border-hairline)' },
    accent: { color: 'var(--accent-primary)', borderColor: 'rgba(255,122,24,0.3)' },
  };
  const cleanTones = {
    neutral: { background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border-hairline)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: 11 },
    accent: { background: 'var(--accent-primary)', color: 'var(--c-black)', fontWeight: 700, fontSize: 12 },
    black: { background: 'var(--c-black)', color: '#fff', fontWeight: 700, fontSize: 12 },
  };

  const style = isClean
    ? {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-body-clean)', whiteSpace: 'nowrap',
        transition: `background var(--dur-micro) var(--ease-standard)`,
        ...(cleanTones[tone] || cleanTones.neutral),
      }
    : isQuest
    ? {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 11px', borderRadius: 'var(--r-pill)',
        border: 'var(--q-border-thin)', fontWeight: 700, fontSize: 12.5,
        fontFamily: 'var(--font-body-quest)', whiteSpace: 'nowrap',
        color: 'var(--q-ink)',
        ...questTones[tone],
      }
    : {
        display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.08em', padding: '4px 10px', border: '1px solid var(--border-hairline)',
        borderRadius: 999, textTransform: 'uppercase', whiteSpace: 'nowrap',
        ...editorialTones[tone] || editorialTones.neutral,
      };

  return <span style={style}>{children}</span>;
}
