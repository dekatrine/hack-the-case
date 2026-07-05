import React from 'react';

/*
 * StepRailItem — numbered step row for the editorial-theme "steps-rail"
 * (case-solving workspace sidebar). Shows a circled index, name, and
 * active/done state.
 */
export function StepRailItem({ index, name, state = 'pending', onClick }) {
  const active = state === 'active';
  const done = state === 'done';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, padding: '10px 12px', margin: '0 -12px',
        borderRadius: 'var(--r-clean-sm)', cursor: 'pointer',
        background: active ? 'var(--surface-sunk)' : 'transparent',
        color: active || done ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      <span style={{
        flex: '0 0 24px', height: 24, borderRadius: '50%',
        border: `1px solid ${active || done ? 'var(--c-black)' : 'var(--border-hairline-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body-clean)', fontWeight: 700, fontSize: 11,
        background: done ? 'var(--c-black)' : 'transparent',
        color: done ? '#fff' : active ? 'var(--c-black)' : 'var(--text-primary)',
      }}>{index}</span>
      <span style={{ fontSize: 14, lineHeight: 1.4, flex: 1, fontFamily: 'var(--font-body-clean)' }}>{name}</span>
    </div>
  );
}
