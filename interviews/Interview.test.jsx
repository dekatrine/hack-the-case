import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Interview from './Interview.jsx';
import calibration from './calibration.json';
import { readRuns } from './storage.js';

vi.mock('../api/analytics.js', () => ({ track: vi.fn() }));
vi.mock('../api/sync.js', () => ({
  ensureAuth: async () => {},
  apiFetch: async () => { throw new Error('Offline'); },
}));
vi.mock('../api/client.js', () => ({
  api: { interviewStory: async () => { throw new Error('Offline'); } },
}));
afterEach(cleanup);

it('resumes a saved draft offline and opens the full debrief with a flagged factual error', async () => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  const latest = () => readRuns()[0];
  const click = name => fireEvent.click(screen.getByRole('button', { name }));
  const type = value => fireEvent.change(screen.getByRole('textbox'), { target: { value } });
  render(<Interview onExit={vi.fn()}/>);
  click(/Диагностика метрики/);
  const begin = screen.getByRole('button', { name: 'Начать интервью' });
  await waitFor(() => expect(begin.disabled).toBe(false));
  const brief = latest().seed.intro;
  fireEvent.click(begin);
  const condition = () => screen.getByText('Условие кейса').closest('details');
  expect(condition().open).toBe(true);
  expect(condition().textContent).toContain(brief);
  const text = calibration.diagnosis.scope;
  type(text);
  click('Не знаю, с чего начать');
  click('Пауза');
  cleanup();

  render(<Interview onExit={vi.fn()}/>);
  click(/Продолжить с хода 1/);
  expect(screen.getByRole('textbox').value).toBe(text);
  expect(condition().open).toBe(true);
  expect(condition().textContent).toContain(brief);
  expect(screen.getByText('−1 балл к итогу')).toBeTruthy();
  for (let i = 0; latest().status === 'active' && i < 17; i += 1) {
    const { queue: [turn], seed } = latest();
    if (turn.options) click(turn.options === 'segments' ? seed.groups[0] : turn.options[0]);
    if (!turn.options || turn.justify) {
      type(turn.fact ? 'Пилот отыграл две трети падения.' : (calibration.diagnosis[turn.id] || calibration.diagnosis[turn.id.replace('_clarify', '')]).replace('{recovery}', seed.recovery));
    }
    if (turn.kind === 'CHALLENGE') expect(screen.getByText('Перебивает')).toBeTruthy();
    click(turn.kind === 'DEMAND' ? 'Завершить интервью' : turn.evidence ? 'Запросить данные' : 'Ответить');
    if (i === 0) {
      expect(condition().open).toBe(false);
      expect(condition().textContent).toContain(brief);
    }
  }
  expect(screen.getByRole('heading', { name: 'Разбор интервью' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Сверка с данными' })).toBeTruthy();
  expect(latest().opened).toContain('independent');
  const previous = latest().seed.pair;
  click('Следующий кейс');
  expect(latest().seed.pair).not.toBe(previous);
});
