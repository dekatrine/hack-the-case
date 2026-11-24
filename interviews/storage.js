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
let sent = new Map();

async function login() {
  authentication ||= ensureAuth().catch(error => { authentication = null; throw error; });
  await authentication;
}

export async function pullRuns() {
  await login();
  const { runs } = await apiFetch('/api/interview-runs');
  for (const run of runs) sent.set(run.id, run.updatedAt);
  return runs;
}

function putRun(run) {
  const body = JSON.stringify(run);
  return apiFetch('/api/interview-runs', {
    method: 'PUT', body, keepalive: new TextEncoder().encode(body).length < 60_000,
  });
}

export async function pushRun(run) {
  if ((sent.get(run.id) || 0) >= run.updatedAt) return;
  await login();
  try {
    await putRun(run);
    sent.set(run.id, Math.max(run.updatedAt, sent.get(run.id) || 0));
  } catch (error) {
    if (error.status !== 401) throw error;
    authentication = null;
    sent = new Map();
    localStorage.removeItem('htc_token');
    await login();
    await putRun(run);
    sent.set(run.id, run.updatedAt);
  }
}
