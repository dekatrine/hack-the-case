import React from 'react';

/*
 * Card — generic content surface. `face="clean"` (DEFAULT) is a plain
 * white panel with a thin 1px gray-200 border, 20px radius, no shadow —
 * the only card style in the current live product. `tone="inverse"`
 * flips to solid black/white — used for a *selected* choice (track picker,
 * industry/difficulty selectors all invert to black when active, rather
 * than getting a colored ring).
 */
export function Card({ children, face = 'clean', tone = 'card', interactive = false, onClick, style = {}, className }) {
  const isQuest = face === 'quest';
  const isClean = face === 'clean';
  const questTones = {
    card: { background: 'var(--q-card)', color: 'var(--q-ink)' },
    coral: { background: 'var(--q-coral)', color: '#fff' },
    plum: { background: 'var(--q-plum)', color: '#fff' },
    sun: { background: 'var(--q-sun)', color: 'var(--q-ink)' },
    mint: { background: 'var(--q-mint)', color: 'var(--q-ink)' },
    sky: { background: 'var(--q-sky)', color: 'var(--q-ink)' },
    pink: { background: 'var(--q-pink)', color: 'var(--q-ink)' },
    cream: { background: 'var(--q-bg-warm)', color: 'var(--q-ink)' },
  };

  const base = isClean
    ? {
        border: tone === 'inverse' ? 'none' : '1px solid var(--border-hairline)',
        borderRadius: 'var(--r-clean-card)',
        background: tone === 'inverse' ? 'var(--c-black)' : 'var(--c-white)',
        color: tone === 'inverse' ? '#fff' : 'var(--text-primary)',
        padding: 24,
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: tone === 'inverse' ? 'var(--shadow-clean-2)' : 'var(--shadow-clean-1)',
        transition: `border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)`,
        willChange: 'transform',
      }
    : isQuest
    ? {
        border: 'var(--q-border)',
        borderRadius: 'var(--q-r-l)',
        boxShadow: 'var(--q-shadow)',
        padding: '18px 20px',
        transition: 'transform .1s ease, box-shadow .1s ease',
        cursor: interactive ? 'pointer' : 'default',
        ...questTones[tone],
      }
    : {
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        cursor: interactive ? 'pointer' : 'default',
      };

  return (
    <div
      className={className}
      style={{ ...base, ...style }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isQuest && interactive) e.currentTarget.style.boxShadow = 'var(--q-shadow-lg)';
        if (isClean && interactive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-clean-2)';
          e.currentTarget.style.transform = `translateY(var(--hover-lift))`;
        }
      }}
      onMouseLeave={(e) => {
        if (isQuest && interactive) e.currentTarget.style.boxShadow = 'var(--q-shadow)';
        if (isClean && interactive) {
          e.currentTarget.style.boxShadow = tone === 'inverse' ? 'var(--shadow-clean-2)' : 'var(--shadow-clean-1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}
