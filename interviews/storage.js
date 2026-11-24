import { ensureAuth, apiFetch } from '../api/sync.js';

const KEY = 'htc_interview_runs_v1';

export function readRuns() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter(run => run?.skeleton?.id && run.seed && Array.isArray(run.queue)) : [];
  } catch {
    return [];
  }
}

export function mergeRuns(local, remote) {
  const runs = new Map(local.map(run => [run.id, run]));
  for (const run of remote) {
    if (!runs.has(run.id) || runs.get(run.id).updatedAt < run.updatedAt) runs.set(run.id, run);
  }
  return [...runs.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveRuns(runs) {
  localStorage.setItem(KEY, JSON.stringify(runs));
}

let authentication;
const sent = new Map();
const pending = new Map();
let flushing;

async function login() {
  authentication ||= ensureAuth().catch(error => { authentication = null; throw error; });
  await authentication;
}

export async function pullRuns() {
  await login();
  const { runs } = await apiFetch('/api/interview-runs');
  for (const run of runs) markSent(run);
  return runs;
}

function markSent(run) {
  sent.set(run.id, Math.max(run.updatedAt, sent.get(run.id) || 0));
}

async function putRun(run) {
  const options = {
    method: 'PUT', body: JSON.stringify(run), signal: AbortSignal.timeout(20_000),
  };
  try {
    await apiFetch('/api/interview-runs', options);
  } catch (error) {
    if (error.status !== 401) throw error;
    authentication = null;
    sent.clear();
    localStorage.removeItem('htc_token');
    await login();
    await apiFetch('/api/interview-runs', { ...options, signal: AbortSignal.timeout(20_000) });
  }
  markSent(run);
}

async function flushRuns() {
  await login();
  for (const [id, snapshot] of pending) {
    if ((sent.get(id) || 0) < snapshot.updatedAt) {
      try {
        await putRun(snapshot);
      } catch (error) {
        if (error.status && error.status !== 429 && error.status < 500) {
          if (pending.get(id) === snapshot) pending.delete(id);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, error.status === 429 ? 5000 : 1000));
        await putRun(pending.get(id));
      }
    }
    if ((sent.get(id) || 0) >= pending.get(id).updatedAt) pending.delete(id);
    else {
      // Keep the latest snapshot and move it to the end of the queue.
      const latest = pending.get(id);
      pending.delete(id);
      pending.set(id, latest);
    }
  }
}

export function pushRun(run) {
  if ((sent.get(run.id) || 0) >= run.updatedAt) return Promise.resolve();
  if ((pending.get(run.id)?.updatedAt || 0) < run.updatedAt) pending.set(run.id, run);
  // A single request stays in flight while newer drafts replace the queued snapshot.
  flushing ||= flushRuns().finally(() => { flushing = undefined; });
  return flushing;
}
