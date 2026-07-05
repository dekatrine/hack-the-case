import React from 'react';

/*
 * SuccessCheck — full-width confirmation panel: a big animated checkmark
 * circle, headline, optional subtitle, optional CTA. Used for "case
 * submitted", "lesson complete", "track unlocked" moments.
 */
export function SuccessCheck({ title, subtitle, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <span style={{
        width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-clean-accent)',
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--c-black)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <div>
        <div style={{ fontFamily: 'var(--font-display-clean)', fontWeight: 600, fontSize: 22, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 360, lineHeight: 1.5 }}>{subtitle}</div>}
      </div>
      {cta && (
        <button
          type="button"
          onClick={onCta}
          style={{
            marginTop: 6, padding: '13px 28px', borderRadius: 'var(--r-pill)', border: 'none',
            background: 'var(--c-black)', color: '#fff', fontWeight: 600, fontSize: 15,
            fontFamily: 'var(--font-display-clean)', cursor: 'pointer', boxShadow: 'var(--shadow-clean-1)',
          }}
        >{cta}</button>
      )}
    </div>
  );
}
