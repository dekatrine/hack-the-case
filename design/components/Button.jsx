import React from 'react';

/*
 * Button — primary interactive control. Three visual "faces" exist:
 * `face="clean"` (DEFAULT) — solid black or lime pill, bold Inter, no
 * border; sizing/weight modeled on Plata's own buttons (generous height,
 * bold label, an icon riding in its own small colored badge rather than
 * sitting bare next to the text) while keeping our lime as the one accent
 * instead of Plata's orange.
 * `face="editorial"` / `face="quest"` are archived looks from an earlier
 * iteration of the codebase — kept for reference only.
 */
export function Button({
  children,
  variant = 'primary',
  face = 'clean',
  size = 'md',
  disabled = false,
  icon = null,
  fullWidth = false,
  onClick,
  type = 'button',
}) {
  const isQuest = face === 'quest';
  const isClean = face === 'clean';
  const pad = isClean
    ? { sm: '10px 18px', md: '15px 26px', lg: '18px 30px' }[size]
    : { sm: '6px 12px', md: isQuest ? '10px 16px' : '13px 22px', lg: '13px 22px' }[size];
  const fontSize = isClean
    ? { sm: 14, md: 16, lg: 17 }[size]
    : { sm: 13, md: isQuest ? 14 : 12, lg: 15 }[size];

  const base = isClean
    ? {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: fullWidth ? '100%' : 'auto',
        padding: pad, borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-display-clean)', fontWeight: 700, fontSize, letterSpacing: 'var(--tracking-tight)',
        whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, border: 'none',
        transition: `opacity var(--dur-micro) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)`,
        willChange: 'transform',
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isQuest ? 8 : 8,
        padding: pad,
        borderRadius: 'var(--r-pill)',
        fontFamily: isQuest ? 'var(--font-display-quest)' : 'var(--font-mono)',
        fontWeight: isQuest ? 700 : 500,
        fontSize,
        letterSpacing: isQuest ? 0 : '0.1em',
        textTransform: isQuest ? 'none' : 'uppercase',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: isQuest ? 'var(--q-border)' : '1px solid var(--border-hairline-strong)',
        transition: isQuest ? 'transform .08s ease, box-shadow .08s ease' : 'all .18s ease',
        boxShadow: isQuest ? 'var(--q-shadow-sm)' : 'none',
      };

  const cleanPalette = {
    primary: { background: 'var(--c-black)', color: '#fff', boxShadow: 'var(--shadow-clean-1)' },
    accent: { background: 'var(--accent-primary)', color: 'var(--c-black)', boxShadow: 'var(--shadow-clean-accent)' },
    neutral: { background: 'var(--c-white)', color: 'var(--c-black)', border: '1px solid var(--border-hairline)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)' },
  };
  const questPalette = {
    primary: { background: 'var(--q-coral)', color: '#fff' },
    plum: { background: 'var(--q-plum)', color: '#fff' },
    mint: { background: 'var(--q-mint)', color: 'var(--q-ink)' },
    sun: { background: 'var(--q-sun)', color: 'var(--q-ink)' },
    ghost: { background: 'transparent', boxShadow: 'none', borderColor: 'var(--q-ink-4)', color: 'var(--q-ink-2)' },
    neutral: { background: 'var(--q-card)', color: 'var(--q-ink)' },
  };
  const editorialPalette = {
    primary: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    ghost: { background: 'transparent', color: 'var(--text-primary)' },
    neutral: { background: 'var(--surface-card)', color: 'var(--text-primary)' },
  };

  const palette = isClean ? cleanPalette : isQuest ? questPalette : editorialPalette;
  const style = { ...base, ...(palette[variant] || palette.primary) };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={(e) => { if (isClean && !disabled) e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={(e) => { if (isClean && !disabled) { e.currentTarget.style.opacity = String(disabled ? 0.4 : 1); e.currentTarget.style.transform = 'scale(1)'; } }}
      onMouseDown={(e) => { if (isClean && !disabled) e.currentTarget.style.transform = `scale(var(--press-scale))`; }}
      onMouseUp={(e) => { if (isClean && !disabled) e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {icon && (
        <span aria-hidden="true" style={{
          width: 24, height: 24, borderRadius: '50%', flex: '0 0 auto',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: variant === 'accent' ? 'rgba(0,0,0,0.12)' : 'var(--accent-primary)',
          color: variant === 'accent' ? 'var(--c-black)' : 'var(--c-black)',
        }}>{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
