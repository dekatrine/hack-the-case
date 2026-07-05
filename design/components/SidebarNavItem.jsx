import React from 'react';

/*
 * SidebarNavItem — left-rail navigation row.
 * `face="clean"` (DEFAULT) — white sidebar, active item = solid black
 * pill with white text, inactive = plain gray text, no icon chip.
 * `face="quest"` (legacy) — dark rail, icon chip, badge count.
 */
export function SidebarNavItem({ icon, label, badge, active = false, face = 'clean', onClick }) {
  if (face === 'clean') {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '11px 14px', borderRadius: 'var(--r-pill)', border: 'none',
          background: active ? 'var(--c-black)' : 'transparent',
          color: active ? '#fff' : 'var(--text-primary)',
          fontFamily: 'var(--font-body-clean)', fontWeight: 600, fontSize: 15,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: `background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)`,
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-sunk)'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {icon && <span style={{ width: 18, height: 18, display: 'flex' }}>{icon}</span>}
        <span>{label}</span>
        {badge != null && (
          <span style={{
            marginLeft: 'auto', fontSize: 12, fontWeight: 700,
            color: active ? '#fff' : 'var(--text-tertiary)',
          }}>{badge}</span>
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '10px 12px', borderRadius: 12, border: '2px solid transparent',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.78)',
        fontFamily: 'var(--font-body-quest)', fontWeight: 600, fontSize: 14.5,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--q-coral)' : 'rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff',
      }}>
        <span style={{ width: 14, height: 14, display: 'flex' }}>{icon}</span>
      </span>
      <span>{label}</span>
      {badge != null && (
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10,
          background: 'var(--q-coral)', color: '#fff', padding: '2px 7px', borderRadius: 999,
        }}>{badge}</span>
      )}
    </button>
  );
}
