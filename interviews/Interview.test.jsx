import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Interview from './Interview.jsx';
import { readRuns, readSeenRuns } from './storage.js';
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

it('discards unfinished interviews on exit and reload and starts with a fresh case', async () => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  const click = name => fireEvent.click(screen.getByRole('button', { name }));
  const begin = async () => {
    click(/Диагностика метрики/);
    const button = screen.getByRole('button', { name: 'Начать интервью' });
    await waitFor(() => expect(button.disabled).toBe(false));
    fireEvent.click(button);
  };

  render(<Interview onExit={vi.fn()}/>);
  await begin();
  const first = readSeenRuns()[0];
  const legacy = { ...first, status: 'active', queue: [], draft: 'Старый черновик' };
  localStorage.setItem('htc_interview_runs_v1', JSON.stringify([legacy]));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Черновик' } });
  click('Выйти из интервью');
  expect(screen.queryByText(/Продолжить с хода/)).toBeNull();
  expect(screen.queryByText(/Прошлые разборы/)).toBeNull();

  cleanup();
  render(<Interview onExit={vi.fn()}/>);
  expect(JSON.parse(localStorage.getItem('htc_interview_runs_v1'))).toEqual([]);
  await begin();
  const second = readSeenRuns().find(item => item.id !== first.id);
  expect(second.seed).not.toEqual(first.seed);
  expect(screen.getByRole('textbox').value).toBe('');
  expect(readRuns()).toEqual([]);

  cleanup();
  render(<Interview onExit={vi.fn()}/>);
  expect(screen.getByRole('heading', { name: 'Кейс-интервью' })).toBeTruthy();
  expect(screen.queryByText(/Продолжить с хода/)).toBeNull();
});

it('creates a configured interview, opens the selected evidence and evaluates only the visited turns', async () => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  api.generate.mockResolvedValue({
    caseText: '# Первый заказ на маркетплейсе',
    caseIntro: '**Продукт** Ночная доставка бытовых товаров.\n\n**Для кого** Те, кто покупает после закрытия магазинов.\n\nНа маркетплейсе 1000 новых покупателей. Из них 200 оформили первый заказ.',
    variantId: 'onboarding',
    caseRoute: [
      { id: 'variant_open', question: 'Что уточнишь про покупку ночью?', hint: 'Назови шаг, одно возможное препятствие и данные для проверки.', chapter: 1, chapterTitle: 'Контекст', nextStepId: 'variant_source' },
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
  fireEvent.click(screen.getByRole('radio', { name: 'Средний' }));
  fireEvent.change(screen.getByLabelText(/Пожелания к кейсу/), { target: { value: 'Первый заказ' } });
  click('Собрать кейс');
  await screen.findByRole('heading', { name: 'Первый заказ на маркетплейсе' });
  expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({
    interviewType: 'product_sense', difficulty: 'Средний', extraContext: 'Первый заказ', mvp: true, detailedInterview: true,
  }));
  const brief = screen.getByRole('region', { name: 'Короткий брифинг' });
  expect(within(brief).getByRole('list', { name: 'Исходные цифры' }).textContent).toContain('200 оформили');
  const full = within(brief).getByText('Полное условие').closest('details');
  expect(full.open).toBe(false);
  expect(full.textContent).toContain('Те, кто покупает после закрытия магазинов.');

  click('Начать интервью');
  const question = screen.getByRole('heading', { name: 'Что уточнишь про покупку ночью?' });
  expect(question.parentElement.textContent).toContain('Что написать.');
  expect(screen.getByText('Условие', { exact: true }).closest('details').open).toBe(false);
  answer('Корзина');
  expect(screen.getByRole('heading', { name: /Назови шаг, одно возможное препятствие/ })).toBeTruthy();
  answer('Проверю переход из корзины к оплате новых заказов.');
  click('По этапам');
  click('Подтвердить выбор');
  expect(screen.getByRole('region', { name: 'Данные по твоему запросу' }).textContent).toContain('120 человек');
  expect(screen.queryByText('В мобильном приложении оплатили 20%.')).toBeNull();
  expect(screen.getByText('«По этапам»')).toBeTruthy();

  expect(readRuns()).toEqual([]);
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

  cleanup();
  render(<Interview onExit={vi.fn()}/>);
  fireEvent.click(screen.getByText('Прошлые разборы', { exact: false }));
  click(/Первый заказ на маркетплейсе/);
  expect(screen.getByText('Аргумент связан с данными.')).toBeTruthy();
});
