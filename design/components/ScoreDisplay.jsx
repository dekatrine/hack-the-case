import React from 'react';

/*
 * ScoreDisplay — large serif score number + mono meta label, used on the
 * evaluation ("eval") screen after a case or mock interview submission.
 */
export function ScoreDisplay({ score, max = 100, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display-clean)', fontWeight: 800, fontSize: 72, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
        {score}<span style={{ fontSize: 28, color: 'var(--text-tertiary)', fontWeight: 700 }}>/{max}</span>
      </div>
      {label && (
        <div style={{ fontFamily: 'var(--font-label-clean)', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 8, fontWeight: 600 }}>
          {label}
        </div>
      )}
    </div>
  );
}
