import React from 'react';

/*
 * ToggleRow — a labeled row with a trailing checkbox/switch, used for
 * multi-select lists (skills, categories, permissions). A clean
 * list-of-checkboxes pattern for a short list of options with icons.
 */
export function ToggleRow({ icon, label, sublabel, checked = false, onChange, locked = false }) {
  return (
    <div
      onClick={() => !locked && onChange && onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px',
        cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.45 : 1,
        borderBottom: '1px solid var(--border-hairline)',
      }}
    >
      {icon && (
        <span style={{
          width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-sunk)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', color: 'var(--text-primary)',
        }}>{icon}</span>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-body-clean)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flex: '0 0 auto',
        border: checked ? 'none' : '1.5px solid var(--border-hairline-strong)',
        background: checked ? 'var(--c-black)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
    </div>
  );
}
