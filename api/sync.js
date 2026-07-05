// Синхронизация прогресса с сервером.
//
// Прогресс по-прежнему живёт в localStorage (ничего в приложении менять
// не нужно), но известные ключи зеркалируются на сервер:
//   - при старте: pull (сервер новее -> перезаписываем локально)
//   - дальше: автопуш каждые 30 сек при изменениях + при уходе со страницы
//
// Аккаунт анонимный (создаётся автоматически). Перенос на другое
// устройство — через короткий код (см. getLinkCode / claimLinkCode).

const TOKEN_KEY = 'htc_token';
const SYNC_TS_KEY = 'htc_sync_ts';

// Все ключи прогресса приложения. Добавляй сюда новые ключи localStorage.
const SYNC_KEYS = [
  'pmquest-progress-v1',
  'pmquest-saved-cases-v1',
  'hc_fc_v2',
  'hc_saved_q_v2',
  'hack-the-case-quiz-progress-v1',
  'htc_skill_history_v1',
];

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL =
  configuredApiBaseUrl?.replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://hack-the-case-api.onrender.com');

let lastPushedSnapshot = null;

function readSnapshot() {
  const data = {};
  for (const key of SYNC_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return JSON.stringify(data);
}

function applySnapshot(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return;
  }
  for (const [key, value] of Object.entries(data || {})) {
    if (SYNC_KEYS.includes(key) && typeof value === 'string') {
      localStorage.setItem(key, value);
    }
  }
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!response.ok) throw new Error(`sync: ${response.status}`);
  return response.json();
}

export async function ensureAuth() {
  if (localStorage.getItem(TOKEN_KEY)) return;
  const { token } = await apiFetch('/api/auth/anonymous', { method: 'POST' });
  localStorage.setItem(TOKEN_KEY, token);
}

export async function pullProgress() {
  const { data, updatedAt } = await apiFetch('/api/progress');
  const localTs = Number(localStorage.getItem(SYNC_TS_KEY) || 0);
  if (data && updatedAt > localTs) {
    applySnapshot(data);
    localStorage.setItem(SYNC_TS_KEY, String(updatedAt));
  }
  lastPushedSnapshot = readSnapshot();
}

export async function pushProgress() {
  const snapshot = readSnapshot();
  if (snapshot === lastPushedSnapshot) return;
  const updatedAt = Date.now();
  await apiFetch('/api/progress', {
    method: 'PUT',
    body: JSON.stringify({ data: snapshot, updatedAt }),
  });
  lastPushedSnapshot = snapshot;
  localStorage.setItem(SYNC_TS_KEY, String(updatedAt));
}

export function startAutoSync() {
  setInterval(() => {
    pushProgress().catch(() => {});
  }, 30_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pushProgress().catch(() => {});
  });
}

// Инициализация целиком: не валим приложение, если backend недоступен.
export async function initSync() {
  try {
    await ensureAuth();
    await pullProgress();
    startAutoSync();
  } catch {
    // офлайн или backend лежит — работаем на localStorage как раньше
  }
}

// ── Перенос на другое устройство ────────────────────────────────────────

export async function getLinkCode() {
  const { code, expiresIn } = await apiFetch('/api/auth/link-code', { method: 'POST' });
  return { code, expiresIn };
}

export async function claimLinkCode(code) {
  const { token } = await apiFetch('/api/auth/claim-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SYNC_TS_KEY, '0'); // заставляем pull перезаписать локальное
  await pullProgress();
  return true;
}
