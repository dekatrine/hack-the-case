// Лёгкий слой аналитики поверх Яндекс.Метрики.
//
// Включается переменной окружения VITE_METRIKA_ID (номер счётчика).
// Без неё события просто логируются в console.debug в dev-режиме —
// код продукта от аналитики не зависит.
//
// События ядра продукта:
//   case_started, interview_started, interview_checked,
//   coach_used, evaluate_received, learn_used, api_error

const METRIKA_ID = import.meta.env.VITE_METRIKA_ID?.trim();

let initialized = false;

export function initAnalytics() {
  if (initialized || !METRIKA_ID || typeof window === 'undefined') return;
  initialized = true;

  // Официальный сниппет Метрики, вставляем динамически.
  (function (m, e, t, r, i, k, a) {
    m[i] =
      m[i] ||
      function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
    m[i].l = 1 * new Date();
    (k = e.createElement(t)),
      (a = e.getElementsByTagName(t)[0]);
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(Number(METRIKA_ID), 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
  });
}

export function track(event, params = {}) {
  if (METRIKA_ID && typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(Number(METRIKA_ID), 'reachGoal', event, params);
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, params);
  }
}
