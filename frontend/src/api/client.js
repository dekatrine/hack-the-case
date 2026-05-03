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

export function fetchConfig() {
  return request('/api/config');
}

export function generateCase(payload) {
  return request('/api/cases/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function askCoach(payload) {
  return request('/api/coach', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function evaluateCase(payload) {
  return request('/api/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
