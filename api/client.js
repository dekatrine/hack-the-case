const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL =
  configuredApiBaseUrl?.replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

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
    throw new Error(body.detail || `Ошибка API: ${response.status}`);
  }

  return response.json();
}

export const api = {
  config: () => request('/api/config'),
  generate: (payload) =>
    request('/api/cases/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  coach: (payload) =>
    request('/api/coach', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  evaluate: (payload) =>
    request('/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
