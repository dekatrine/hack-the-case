import { describe, expect, it } from 'vitest';
import { buildBackup, restoreBackup } from './backup.js';

const fake = (init = {}) => {
  const map = new Map(Object.entries(init));
  return { getItem: k => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, v), map };
};

describe('backup', () => {
  it('round-trips progress keys and skips tokens', () => {
    const from = fake({ htc_interview_runs_v1: '[{"id":1}]', htc_token: 'secret', htc_onboarding_v1: '{"role":"pm"}' });
    const backup = buildBackup(from);
    expect(Object.keys(backup.data).sort()).toEqual(['htc_interview_runs_v1', 'htc_onboarding_v1']);
    const to = fake();
    expect(restoreBackup(JSON.stringify(backup), to)).toEqual({ ok: true, restored: 2 });
    expect(to.getItem('htc_interview_runs_v1')).toBe('[{"id":1}]');
  });
  it('rejects foreign or broken files without writing', () => {
    const to = fake();
    expect(restoreBackup('not json', to).ok).toBe(false);
    expect(restoreBackup('{"format":"other","data":{}}', to).ok).toBe(false);
    expect(restoreBackup(JSON.stringify({ format: 'hack-the-case-backup', data: { htc_interview_runs_v1: '{bad' } }), to).ok).toBe(false);
    expect(restoreBackup(JSON.stringify({ format: 'hack-the-case-backup', data: { evil: '1' } }), to).ok).toBe(false);
    expect(to.map.size).toBe(0);
  });
});
