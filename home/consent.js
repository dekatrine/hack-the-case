const KEY = 'htc_consent_v1';
export function hasConsent() {
  try { return Boolean(localStorage.getItem(KEY)); } catch { return true; }
}
export function giveConsent(now = new Date()) {
  try { localStorage.setItem(KEY, JSON.stringify({ at: now.toISOString(), version: 1 })); } catch { /* ignore */ }
}
