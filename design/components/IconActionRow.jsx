import React from 'react';

/*
 * IconActionRow — a row of 2-4 equal-width circular icon buttons, each with
 * a caption underneath. Used for a small set of step-level actions (save
 * draft, restart, skip) tied to one object on screen.
 */
export function IconActionRow({ actions = [] }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          disabled={a.disabled}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '14px 8px', borderRadius: 'var(--r-clean-sm)', border: '1px solid var(--border-hairline)',
            background: 'var(--c-white)', cursor: a.disabled ? 'not-allowed' : 'pointer',
            opacity: a.disabled ? 0.4 : 1,
            transition: 'background var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          }}
          onMouseEnter={(e) => { if (!a.disabled) e.currentTarget.style.boxShadow = 'var(--shadow-clean-1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ width: 18, height: 18, display: 'flex', color: a.danger ? 'var(--semantic-danger)' : 'var(--text-primary)' }}>{a.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: a.danger ? 'var(--semantic-danger)' : 'var(--text-primary)', fontFamily: 'var(--font-body-clean)' }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
