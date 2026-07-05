import React from 'react';

/*
 * Field — labeled form control (text/select/textarea) matching the `.field`
 * pattern used across case-submission and agent-config forms. Editorial
 * face only — the Quest surface doesn't currently define its own form
 * styling in the source app, so Field renders the editorial treatment
 * regardless of `face` (documented as an intentional simplification).
 */
export function Field({ label, as = 'input', options = [], value, onChange, placeholder, fullWidth = false }) {
  const controlStyle = {
    background: 'var(--surface-sunk)',
    border: '1px solid var(--border-hairline)',
    padding: '12px 16px',
    borderRadius: 'var(--r-clean-sm)',
    fontFamily: 'var(--font-body-clean)',
    fontSize: 15,
    color: 'var(--text-primary)',
    width: '100%',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <label style={{ fontFamily: 'var(--font-label-clean)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
        {label}
      </label>
      {as === 'select' ? (
        <select style={controlStyle} value={value} onChange={onChange}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea style={{ ...controlStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.5 }} value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input style={controlStyle} value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}
