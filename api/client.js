import { track } from './analytics.js';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL =
  configuredApiBaseUrl?.replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://hack-the-case-api.onrender.com');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    track('api_error', { path, status: response.status });
    throw new Error(body.detail || `Ошибка API: ${response.status}`);
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
  const response = await fetch(`${API_BASE_URL}/api/cases/generate/stream`, {
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
