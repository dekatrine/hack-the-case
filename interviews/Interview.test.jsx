import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Interview from './Interview.jsx';
import calibration from './calibration.json';
import { currentTurn, optionLabel } from './engine.js';
import { readRuns } from './storage.js';
import { api } from '../api/client.js';

vi.mock('../api/analytics.js', () => ({ track: vi.fn() }));
vi.mock('../api/sync.js', () => ({
  ensureAuth: async () => {},
  apiFetch: async () => { throw new Error('Offline'); },
}));
vi.mock('../api/client.js', () => ({
  api: { interviewStory: async () => { throw new Error('Offline'); }, generate: vi.fn(), evaluate: vi.fn() },
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
    const run = latest();
    const turn = currentTurn(run);
    const { seed } = run;
    if (turn.options) click(turn.options === 'segments' ? seed.groups[0] : optionLabel(turn, turn.options[0]));
    if (!turn.options || turn.justify) {
      type(turn.fact ? 'Пилот отыграл две трети падения.' : (calibration.diagnosis[turn.id] || calibration.diagnosis[turn.id.replace('_clarify', '')]).replace('{recovery}', seed.recovery));
    }
    if (turn.kind === 'CHALLENGE') expect(screen.getByText('Уточнение интервьюера')).toBeTruthy();
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


it('creates a configured interview, opens the selected evidence and evaluates only the visited turns', async () => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  api.generate.mockResolvedValue({
    caseText: '# Первый заказ на маркетплейсе',
    caseIntro: 'На маркетплейсе 1000 новых покупателей. Из них 200 оформили первый заказ.',
    variantId: 'onboarding',
    caseRoute: [
      { id: 'variant_open', question: 'Что уточнишь?', chapter: 1, chapterTitle: 'Контекст', nextStepId: 'variant_source' },
      { id: 'variant_source', question: 'Что запросишь?', chapter: 1, chapterTitle: 'Контекст',
        options: ['По этапам', 'По устройствам'], nextByAnswer: { 'По этапам': 'variant_read_0', 'По устройствам': 'variant_read_1' } },
      { id: 'variant_read_0', question: 'Сколько дошли до оплаты?', chapter: 2, chapterTitle: 'Данные',
        evidence: 'Из корзины к оплате перешли 120 человек.', nextStepId: 'variant_twist' },
      { id: 'variant_read_1', question: 'Чем отличаются устройства?', chapter: 2, chapterTitle: 'Данные',
        evidence: 'В мобильном приложении оплатили 20%.', nextStepId: 'variant_twist' },
      { id: 'variant_twist', question: 'Что поменялось?', chapter: 3, chapterTitle: 'Новый факт',
        scene: 'До релиза можно изменить только один экран.', nextStepId: 'variant_final' },
      { id: 'variant_final', question: 'Какое решение?', chapter: 4, chapterTitle: 'Решение' },
    ],
  });
  api.evaluate.mockResolvedValue({ evaluation: JSON.stringify({ summary: 'Аргумент связан с данными.' }),
    score: { final: 82, quality: 82, hintPenalty: 0 } });
  const click = name => fireEvent.click(screen.getByRole('button', { name }));
  const answer = (value, button = 'Ответить') => {
    fireEvent.change(screen.getByRole('textbox', { name: 'Твой ответ' }), { target: { value } });
    click(button);
  };

  render(<Interview onExit={vi.fn()}/>);
  click(/Настроить своё интервью/);
  fireEvent.change(screen.getByLabelText('Сложность'), { target: { value: 'Средний' } });
  fireEvent.change(screen.getByLabelText(/Пожелания к кейсу/), { target: { value: 'Первый заказ' } });
  click('Создать интервью');
  await screen.findByRole('heading', { name: 'Первый заказ на маркетплейсе' });
  expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({
    interviewType: 'product_sense', difficulty: 'Средний', extraContext: 'Первый заказ', mvp: true,
  }));
  click('Начать интервью');
  answer('Корзина');
  expect(screen.getByRole('heading', { name: /Назови шаг, одно возможное препятствие/ })).toBeTruthy();
  answer('Проверю переход из корзины к оплате новых заказов.');
  click('По этапам');
  click('Подтвердить выбор');
  expect(screen.getByRole('region', { name: 'Данные по твоему запросу' }).textContent).toContain('120 человек');
  expect(screen.queryByText('В мобильном приложении оплатили 20%.')).toBeNull();
  expect(screen.getByText('«По этапам»')).toBeTruthy();

  click('Пауза');
  cleanup();
  render(<Interview onExit={vi.fn()}/>);
  click(/Продолжить с хода/);
  expect(screen.getByText(/120 человек/)).toBeTruthy();
  answer('До оплаты дошли сто двадцать покупателей из корзины.');
  expect(screen.getByText('До релиза можно изменить только один экран.')).toBeTruthy();
  answer('Исправлю вариант заполнения адреса на одном экране.');
  answer('Упрощу ввод адреса и сравню оплату с прежней версией.', 'Завершить интервью');
  await screen.findByText('Аргумент связан с данными.');
  expect(api.evaluate.mock.lastCall[0].caseRoute.map(step => step.id)).toEqual([
    'variant_open', 'variant_source', 'variant_read_0', 'variant_twist', 'variant_final',
  ]);
  expect(api.evaluate.mock.lastCall[0].answers.variant_open).toContain('Уточнение: Проверю переход');
  expect(readRuns()[0].review.score.final).toBe(82);
});
