import { track } from './analytics.js';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/+$/, '');
const defaultApiBaseUrl = import.meta.env.DEV ? '' : 'https://hack-the-case-api.onrender.com';
let detectedLocalBase = null;

// Some users already have Vite running from an older branch without the /api proxy.
// In dev, discover a working local API instead of requiring them to set ports manually.
const devCandidates = import.meta.env.DEV && !configuredApiBaseUrl
  ? ['', 'http://127.0.0.1:8001', 'http://localhost:8001',
      'http://127.0.0.1:8000', 'http://localhost:8000']
  : [];

function apiBase() {
  return configuredApiBaseUrl || detectedLocalBase || defaultApiBaseUrl;
}

async function fetchApi(path, options = {}) {
  const opts = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  };
  const candidates = detectedLocalBase !== null || devCandidates.length === 0
    ? [apiBase()] : devCandidates;
  let lastError;
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}${path}`, opts);
      if (response.ok) {
        // A stale Vite dev server can reply to /api/config with index.html (200).
        // Treat that as a missing proxy, not as a valid API connection.
        const contentType = response.headers.get('content-type') || '';
        if (path === '/api/config' && !contentType.includes('application/json')) {
          lastError = new Error('Frontend вернул HTML вместо настроек API');
          if (devCandidates.length > 1) continue;
          throw lastError;
        }
        if (devCandidates.length) detectedLocalBase = base;
        return response;
      }
      // Vite returns a plain-text 5xx if its proxy is not connected. Only
      // fall back in that case; never re-send real backend 4xx / JSON 5xx.
      if (base === '' && devCandidates.length > 1 && response.status >= 500) {
        const kind = response.headers.get('content-type') || '';
        if (!kind.includes('application/json')) {
          lastError = new Error('Локальный proxy недоступен');
          continue;
        }
      }
      return response;
    } catch (err) {
      lastError = err;
      // Only safe to retry a read request; POST requests could be duplicated.
      if ((opts.method || 'GET').toUpperCase() !== 'GET') break;
    }
  }
  if (detectedLocalBase !== null && devCandidates.length && (opts.method || 'GET').toUpperCase() === 'GET') {
    // Backend may have moved ports since the last request.
    detectedLocalBase = null;
    if (!options.__rediscovered) return fetchApi(path, { ...options, __rediscovered: true });
  }
  throw lastError || new Error('API недоступен');
}

async function request(path, options = {}) {
  const response = await fetchApi(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    track('api_error', { path, status: response.status });
    const detail = typeof body?.detail === 'string' ? body.detail.trim() : '';
    const fallback = response.status === 422
      ? 'Сервер не принял данные для обработки.'
      : `Ошибка API: ${response.status}`;
    throw new Error(detail || fallback);
  }
  return response.json();
}

// Событие продукта для каждого вызова ядра. Отправляем ПОСЛЕ успешного
// ответа, чтобы события отражали реальные завершённые действия.
function withEvent(promise, event, params) {
  return promise.then((data) => {
    track(event, params);
    return data;
  });
}

// Стриминговая генерация кейса (SSE). onChunk(text) вызывается на каждую
// дельту; резолвится финальным объектом {caseText, suggestedStepIds, phases}.
// Бросает ошибку, если стрим не удался — вызывающий может откатиться на
// обычный api.generate().
async function generateStream(payload, onChunk) {
  const response = await fetch(`${apiBase()}/api/cases/generate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok || !response.body) {
    throw new Error(`Ошибка API: ${response.status}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      let event;
      try {
        event = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (event.type === 'chunk' && typeof event.text === 'string') {
        onChunk?.(event.text);
      } else if (event.type === 'done') {
        result = event;
      } else if (event.type === 'error') {
        throw new Error(event.detail || 'Ошибка генерации');
      }
    }
  }
  if (!result) throw new Error('Стрим оборвался без результата');
  track('case_started', { trackId: payload?.trackId, difficulty: payload?.difficulty, stream: true });
  return result;
}

export const api = {
  interviewStory: (payload, signal) => request('/api/interviews/story', {
    method: 'POST', body: JSON.stringify(payload), signal,
  }),
  explainCondition: (payload) => request('/api/cases/explain', {
    method: 'POST', body: JSON.stringify(payload),
  }),
  requestEvidence: (payload) => request('/api/cases/request-evidence', {
    method: 'POST', body: JSON.stringify(payload),
  }),
  config: () => request('/api/config'),
  generateStream,
  generate: (payload) =>
    withEvent(
      request('/api/cases/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'case_started',
      { trackId: payload?.trackId, difficulty: payload?.difficulty },
    ),
  generateInterview: (payload) =>
    withEvent(
      request('/api/interviews/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'interview_started',
      { blockId: payload?.blockId, difficulty: payload?.difficulty },
    ),
  checkInterview: (payload) =>
    withEvent(
      request('/api/interviews/check', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'interview_checked',
      { blockId: payload?.blockId },
    ),
  coach: (payload) =>
    withEvent(
      request('/api/coach', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'coach_used',
      { stepId: payload?.stepId, trackId: payload?.trackId },
    ),
  evaluate: (payload) =>
    withEvent(
      request('/api/evaluate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'evaluate_received',
      { trackId: payload?.trackId },
    ),
  learnExplain: (payload) =>
    withEvent(
      request('/api/learn/explain', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'learn_used',
      { kind: 'explain' },
    ),
  learnSession: (payload) =>
    withEvent(
      request('/api/learn/session', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'learn_used',
      { kind: 'session' },
    ),
};
