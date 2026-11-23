import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MvpApp, { STORAGE_KEY } from './MvpApp.jsx';
import { api } from './api/client.js';
import INTERVIEWS from './backend/app/product_interviews.json';
vi.mock('./api/client.js', () => ({ api: { config: vi.fn(), generate: vi.fn(), evaluate: vi.fn() } }));
const review = JSON.stringify({ summary: 'Проверь конверсию по этапам.', strengths: ['Есть гипотеза'], improvements: ['Нет расчёта'], topTips: ['Посчитай воронку'] });
beforeEach(() => {
  localStorage.clear(); vi.resetAllMocks(); window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal ??= function () { this.open = true; };
  HTMLDialogElement.prototype.close ??= function () {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
  api.config.mockResolvedValue({ industries: ['Маркетплейсы'], difficultyLevels: { Начальный: 'Описание' } });
  api.generate.mockResolvedValue({ caseText: '# Падение конверсии\nКонверсия упала с 10% до 8%.' });
  api.evaluate.mockResolvedValue({ evaluation: review });
});
afterEach(cleanup);
async function newCase() {
  render(<MvpApp/>);
  fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
  await screen.findByLabelText('02 / Отрасль');
  fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
  await screen.findByRole('heading', { name: 'Твой ход' });
}
function openCondition() {
  fireEvent.click(screen.getByRole('button', { name: /^Условие (кейса|и данные)$/ }));
  return within(screen.getByRole('dialog', { name: 'Условие кейса' }));
}
function closeCondition() {
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть условие' }));
}
const productQuestions = INTERVIEWS.find(t => t.id === 'product_sense').questions;
function fillCase(problem = 'Падает конверсия') {
  productQuestions.forEach((q, i) => {
    fireEvent.change(screen.getByRole('textbox', { name: `${i + 1}. ${q.label}` }), { target: { value: i === 0 ? problem : `Мой ответ на вопрос ${i + 1}` } });
    if (i < productQuestions.length - 1) fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
  });
}
describe('MVP core flow', () => {
  it('reveals only the chosen story branch and restores the new path after reloading', async () => {
    const chapter = { chapter: 1, chapterTitle: 'Первый выбор' };
    const caseRoute = [
      { ...chapter, id: 'choose', question: 'Что запросишь?', options: ['Спрос', 'Ресурсы'], nextByAnswer: { Спрос: 'demand', Ресурсы: 'team' } },
      { ...chapter, id: 'demand', question: 'Что скажешь о спросе?', evidence: 'В листе ожидания 80 заявок.', nextStepId: 'final' },
      { ...chapter, id: 'team', question: 'Что скажешь о ресурсах?', evidence: 'Доступен один аналитик.', nextStepId: 'final' },
      { chapter: 4, chapterTitle: 'Решение', id: 'final', question: 'Напиши рекомендацию.', longAnswer: true },
    ];
    api.generate.mockResolvedValueOnce({ caseText: '# Пилот\nВ листе ожидания 80 заявок. Доступен один аналитик.', caseIntro: 'Команда обсуждает запуск.', caseRoute });
    render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: /Как вырастить прибыль/ }));
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByText('Глава 1 из 4 · Шаг 1');
    expect(screen.queryByText('В листе ожидания 80 заявок.')).toBeNull();
    expect(screen.queryByText('Доступен один аналитик.')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Спрос' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const demand = openCondition();
    expect(demand.getByText('В листе ожидания 80 заявок.')).toBeTruthy();
    expect(demand.queryByText('Доступен один аналитик.')).toBeNull();
    closeCondition();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Проверю намерение купить.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Ресурсы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    cleanup(); render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    const team = openCondition();
    expect(team.getByText('Доступен один аналитик.')).toBeTruthy();
    expect(team.queryByText('В листе ожидания 80 заявок.')).toBeNull();
    closeCondition();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Проверю загрузку аналитика.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByPlaceholderText('Разверни аргументы и опирайся на данные…')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Запущу пилот с небольшой группой.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    expect(api.evaluate.mock.lastCall[0].caseRoute.map(step => step.id)).toEqual(['choose', 'team', 'final']);
    expect(api.evaluate.mock.lastCall[0].answers).not.toHaveProperty('demand');
  });

  it('restores a case-specific route and reviews answers to its own questions', async () => {
    const evidence = '| Версия | Ошибки |\n| --- | --- |\n| Новая | 14% |';
    const caseRoute = [
      { id: 'release_view', question: 'Какой срез запросишь?', hint: 'Выбери вариант.', options: ['По версиям', 'По регионам'] },
      { id: 'release_read', question: 'Какой вывод сделаешь?', evidence },
    ];
    api.generate.mockResolvedValueOnce({ caseText: `# Проблема после релиза\n\n**Дополнительный срез данных**\n\n${evidence}`, caseRoute });
    render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: /Почему падает конверсия/ }));
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByText('Шаг 1 из 2');
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'По версиям' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.queryByRole('table')).toBeNull();
    expect(openCondition().getByRole('table')).toBeTruthy();
    closeCondition();
    cleanup(); render(<MvpApp/>);
    expect(screen.getByText('1 из 2 ответов')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Шаг 2 из 2')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Проверю ошибки новой версии' } });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    expect(api.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      caseRoute, answers: { release_view: 'По версиям', release_read: 'Проверю ошибки новой версии' },
    }));
  });

  it('includes archived cases when generating and refuses a repeated condition', async () => {
    await newCase();
    const [previous] = JSON.parse(localStorage.getItem(STORAGE_KEY));
    cleanup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...previous, archivedAt: new Date().toISOString() }]));
    render(<MvpApp/>);
    fireEvent.click(screen.getAllByRole('button', { name: /Новый кейс/ })[0]);
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByText('Получился повтор предыдущего кейса. Попробуй сгенерировать ещё раз.');
    expect(api.generate).toHaveBeenLastCalledWith(expect.objectContaining({ recentCases: [previous.caseText] }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
  });

  it('generates, saves, evaluates and keeps immutable versions when improving', async () => {
    await newCase();
    expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({ mvp: true, industry: 'Маркетплейсы' }));
    expect(screen.queryByText('Уроки')).toBeNull();
    fillCase();
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить решение' }));
    expect(screen.getByRole('button', { name: 'Проверить новую версию' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^Шаг 1:/ }));
    fireEvent.change(screen.getByLabelText(/1\. Какую задачу пользователя/), { target: { value: 'Конверсия упала на 20% относительно исходной' } });
    fireEvent.click(screen.getByRole('button', { name: /^Шаг 8:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Проверить новую версию' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))[0];
    expect(saved.attempts).toHaveLength(2);
    expect(saved.attempts[0].answers.problem).toBe('Падает конверсия');
    expect(saved.attempts[1].answers.problem).toContain('20%');
    fireEvent.change(screen.getByLabelText('Версия решения'), { target: { value: '0' } });
    expect(screen.getByText('Падает конверсия')).toBeTruthy();
  });
  it('rejects an empty answer and retains drafts after evaluation errors and remount', async () => {
    await newCase();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(api.evaluate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Напиши ответ на этот вопрос');
    fillCase('Мой черновик');
    api.evaluate.mockRejectedValueOnce(new Error('Временная ошибка'));
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByText('Временная ошибка');
    cleanup(); render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Шаг 8 из 8')).toBeTruthy();
    expect(screen.getByRole('textbox').value).toBe('Мой ответ на вопрос 8');
    fireEvent.click(screen.getByRole('button', { name: /^Шаг 1:/ }));
    expect(screen.getByLabelText(/1\. Какую задачу пользователя/).value).toBe('Мой черновик');
  });
  it('shows one editable answer, retains it while typing and across backwards navigation', async () => {
    await newCase();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Первая мысль' } });
    expect(screen.getByRole('textbox').value).toBe('Первая мысль');
    expect(screen.getByText('Шаг 1 из 8')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Выбранный сегмент' } });
    fireEvent.click(screen.getByRole('button', { name: 'Назад', exact: true }));
    expect(screen.getByRole('textbox').value).toBe('Первая мысль');
    expect(screen.getByRole('progressbar', { name: 'Заполненные ответы' }).getAttribute('aria-valuenow')).toBe('2');
  });
  it('returns to the first missing answer instead of submitting an incomplete full case', async () => {
    await newCase();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Проблема определена' } });
    fireEvent.click(screen.getByRole('button', { name: /^Шаг 8:/ }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Риск учтён' } });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    expect(screen.getByText('Шаг 2 из 8')).toBeTruthy();
    expect(api.evaluate).not.toHaveBeenCalled();
  });
  it('resumes an older partial draft at its first unanswered question without changing its answers', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id:'older-case', caseText:'Старое условие', title:'Сохранённый кейс', params:{interviewType:'product_sense'}, answers:{problem:'Старая мысль',risk:'Старый риск'}, attempts:[] }]));
    render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name:'Продолжить' }));
    expect(screen.getByText('Шаг 2 из 8')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name:/^Шаг 1:/ }));
    expect(screen.getByRole('textbox').value).toBe('Старая мысль');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].answers.risk).toBe('Старый риск');
  });
  it('retries generation without creating empty cases or duplicate submissions', async () => {
    api.generate.mockRejectedValueOnce(new Error('Генерация недоступна'));
    render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByText('Генерация недоступна');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByRole('heading', { name: 'Твой ход' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
  });
  it('opens a suggested topic and submits the selected direction and level', async () => {
    api.config.mockResolvedValue({ industries: ['Маркетплейсы'], difficultyLevels: { Начальный: 'Просто', Средний: 'Сложнее' } });
    render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: /Как вырастить прибыль/ }));
    await screen.findByLabelText('02 / Отрасль');
    expect(screen.getByRole('button', { name: /Продуктовая стратегия/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Средний' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByRole('heading', { name: 'Твой ход' });
    expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({ trackId: 'product', interviewType: 'product_strategy', difficulty: 'Средний', extraContext: 'Рост прибыли маркетплейса при ограниченном бюджете' }));
  });
  it('opens theory from a solution and returns without losing the draft', async () => {
    await newCase();
    fireEvent.change(screen.getByLabelText(/1\. Какую задачу пользователя/), { target: { value: 'Сохранённая мысль' } });
    fireEvent.click(screen.getByRole('button', { name: 'Карточки' }));
    expect(screen.getByRole('heading', { name: 'Карточки для практики' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к решению' }));
    expect(screen.getByLabelText(/1\. Какую задачу пользователя/).value).toBe('Сохранённая мысль');
  });
  it('saves a case material, restores it after reload and removes it from saved theory', async () => {
    await newCase();
    const answer = screen.getByRole('textbox');
    fireEvent.change(answer, { target: { value: 'Черновик ответа' } });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(openCondition().getByText('Конверсия упала с 10% до 8%.')).toBeTruthy();
    closeCondition();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('textbox').value).toBe('Черновик ответа');
    const summary = openCondition().getByText('Какие материалы могут понадобиться');
    const panel = summary.closest('details');
    panel.open = true;
    fireEvent.click(within(panel).getAllByRole('button', { name: 'Добавить в мои карточки' })[0]);
    fireEvent.click(within(panel).getByRole('button', { name: 'Открыть мои карточки' }));
    expect(screen.getByRole('button', { name: 'Мои карточки · 1' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Сегментация' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Конверсия' })).toBeNull();
    cleanup(); render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Карточки' }));
    fireEvent.click(screen.getByRole('button', { name: 'Мои карточки · 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'В моих карточках · убрать' }));
    expect(screen.getByRole('button', { name: 'Мои карточки · 0' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('htc_saved_theory_v1'))).toEqual([]);
  });
  it('recovers config loading and handles invalid storage', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    api.config.mockRejectedValueOnce(new Error('Offline'));
    render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Повторить загрузку' }));
    await waitFor(() => expect(screen.getByLabelText('02 / Отрасль').value).toBe('Маркетплейсы'));
  });
});
