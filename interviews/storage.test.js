import { expect, it, vi } from 'vitest';
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
  const first = pushRun({ id: 'test', updatedAt: 100 });
  await vi.waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
  const second = pushRun({ id: 'test', updatedAt: 101 });
  const last = pushRun({ id: 'test', updatedAt: 102, status: 'finished' });
  expect(apiFetch).toHaveBeenCalledTimes(1);
  complete({ ok: true });
  await Promise.all([first, second, last]);
  expect(apiFetch.mock.calls.map(([, options]) => JSON.parse(options.body).updatedAt)).toEqual([100, 102]);
});
