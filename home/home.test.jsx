import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import MvpApp from '../MvpApp.jsx';

vi.mock('../api/analytics.js', () => ({ track: vi.fn() }));
vi.mock('../api/sync.js', () => ({ ensureAuth: async () => {}, apiFetch: async () => { throw new Error('Offline'); } }));
afterEach(cleanup);

it('shows onboarding once, then the home with a recommended interview', () => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  render(<MvpApp/>);
  expect(screen.getByText('Готовишься к кейс-собесу?')).toBeTruthy();
  const next = () => fireEvent.click(screen.getByRole('button', { name: /Дальше|Показать первый собес/ }));
  fireEvent.click(screen.getByRole('radio', { name: 'Продуктовый аналитик' })); next();
  fireEvent.click(screen.getByRole('radio', { name: /Ещё не ходил/ })); next();
  fireEvent.click(screen.getByRole('radio', { name: /До 15 минут/ })); next();
  expect(screen.getByText('Начни с первого собеса')).toBeTruthy();
  expect(screen.getByText(/Диагностика метрики/)).toBeTruthy();
  expect(screen.getByText(/за два захода/)).toBeTruthy();
  cleanup();
  render(<MvpApp/>);
  expect(screen.queryByText('Готовишься к кейс-собесу?')).toBeNull();
});

it('shows the due skill re-check on the home and clears it on start', () => {
  localStorage.clear(); window.scrollTo = vi.fn();
  localStorage.setItem('htc_onboarding_v1', JSON.stringify({ done: true, role: 'analyst', level: 'new', time: 15 }));
  localStorage.setItem('htc_skill_review_v1', JSON.stringify({ runId: 'x', skillId: 'hypotheses', label: 'Гипотезы', due: Date.now() - 1000 }));
  render(<MvpApp/>);
  expect(screen.getByText('Проверим навык «Гипотезы»')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Не сейчас/ }));
  expect(localStorage.getItem('htc_skill_review_v1')).toBeNull();
});
