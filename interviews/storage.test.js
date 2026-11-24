import { describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../api/sync.js';
import { pushRun } from './storage.js';

vi.mock('../api/sync.js', () => ({
  ensureAuth: async () => {},
  apiFetch: vi.fn(),
}));

it('serializes writes and sends the latest queued snapshot after the in-flight request', async () => {
  let complete;
  apiFetch.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  apiFetch.mockResolvedValue({ ok: true });
  const first = pushRun({ id: 'test', updatedAt: 100, status: 'finished' });
  await vi.waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
  const second = pushRun({ id: 'test', updatedAt: 101, status: 'finished' });
  const last = pushRun({ id: 'test', updatedAt: 102, status: 'finished' });
  expect(apiFetch).toHaveBeenCalledTimes(1);
  complete({ ok: true });
  await Promise.all([first, second, last]);
  expect(apiFetch.mock.calls.map(([, options]) => JSON.parse(options.body).updatedAt)).toEqual([100, 102]);
});

describe('черновик интервью', () => {
  it('хранится 24 часа и очищается после завершения', async () => {
    const { saveDraft, readDraft, clearDraft } = await import('./storage.js');
    const run = { id: 'r1', skeleton: { id: 'discovery' }, seed: {}, queue: [{}], status: 'active', updatedAt: 1000 };
    saveDraft(run);
    expect(readDraft(2000)?.id).toBe('r1');
    expect(readDraft(1000 + 25 * 3600 * 1000)).toBeNull();
    saveDraft(run);
    saveDraft({ ...run, status: 'finished' });
    expect(readDraft(2000)).toBeNull();
    clearDraft('r1');
  });
});
