import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MvpApp, { STORAGE_KEY } from './MvpApp.jsx';
import { api } from './api/client.js';
import INTERVIEWS from './backend/app/product_interviews.json';
import { SEARCH_SLICES } from './cases/searchDiagnostic.js';
vi.mock('./api/client.js', () => ({ api: { config: vi.fn(), generate: vi.fn(), requestEvidence: vi.fn(), evaluate: vi.fn(), coach: vi.fn() } }));
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
  render(<MvpApp initialScreen="library"/>);
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
  it('reveals the requested slice and allows revision on the same screen', async () => {
    const [funnel, versions] = SEARCH_SLICES;
    const feedback = 'Ты локализовала падение. Чем проверишь, что оно связано с оплатой?';
    api.requestEvidence.mockResolvedValueOnce({ source: null }).mockResolvedValueOnce({ source: versions.label });
    api.evaluate.mockResolvedValue({
      evaluation: JSON.stringify({ summary: 'Разбор', topTips: [feedback] }),
    });
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Новый кейс' }));
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: /Падение заказов из поиска/ }));
    expect(api.generate).not.toHaveBeenCalled();
    const type = value => fireEvent.change(screen.getByRole('textbox'), { target: { value } });
    const request = () => fireEvent.click(screen.getByRole('button', { name: 'Запросить данные' }));
    type('Посмотрю аналитику.');
    request();
    expect((await screen.findByRole('alert')).textContent).toContain('Уточни один показатель');
    expect(screen.queryByText(funnel.evidence)).toBeNull();
    expect(screen.queryByText(versions.evidence)).toBeNull();

    type('Сравню конверсию на старой и новой версиях.');
    request();
    expect(await screen.findByText(versions.evidence)).toBeTruthy();
    expect(screen.queryByText(funnel.evidence)).toBeNull();
    expect(screen.getByRole('textbox', { name: versions.question })).toBeTruthy();

    type('Откатим новую версию, она сломала оплату.');
    fireEvent.click(screen.getByRole('button', { name: 'Проверить ответ' }));
    await screen.findByText(feedback);
    expect(screen.getByRole('textbox').value).toBe('Откатим новую версию, она сломала оплату.');
    expect(api.evaluate).toHaveBeenLastCalledWith(expect.objectContaining({
      caseRoute: [
        expect.objectContaining({ id: 'search_request' }),
        expect.objectContaining({ id: 'search_decision', question: versions.question, evidence: versions.evidence }),
      ],
    }));
    type('Приостановлю раскатку и сравню долю ошибок оплаты по версиям.');
    expect(screen.getByText('Комментарий к прошлому ответу')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Проверить новую версию' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].attempts).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Полный разбор' }));
    expect(screen.getByRole('heading', { name: 'Разбор решения' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Улучшить решение' }));
    fireEvent.click(screen.getByText('Твой запрос'));
    fireEvent.click(screen.getByRole('button', { name: 'Изменить запрос и начать решение заново' }));
    api.requestEvidence.mockResolvedValueOnce({ source: funnel.label });
    type('Сравню переходы из поиска в корзину и заказ.');
    request();
    expect(await screen.findByText(funnel.evidence)).toBeTruthy();
    expect(screen.queryByText(versions.evidence)).toBeNull();
    expect(screen.getByRole('textbox').value).toBe('');

    cleanup(); render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText(funnel.evidence)).toBeTruthy();
  });

  it('resumes a self-check with case data and shows the review after submission', async () => {
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: 'Самопроверка' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByText('Самопроверка');
    expect(openCondition().getByText('Конверсия упала с 10% до 8%.')).toBeTruthy();
    expect(screen.queryByText('Разобраться в условии')).toBeNull();
    closeCondition();
    expect(screen.queryByRole('button', { name: /подсказка/i })).toBeNull();
    expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBeNull();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Начну с причины падения.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(api.evaluate).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].mode).toBe('self_check');
    cleanup(); render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Самопроверка')).toBeTruthy();
    expect(screen.getByText('Шаг 2 из 8')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('textbox').value).toBe('Начну с причины падения.');
    fillCase();
    fireEvent.click(screen.getByRole('button', { name: 'Завершить и получить разбор' }));
    await screen.findByText('Результат самопроверки');
    expect(api.evaluate).toHaveBeenCalledTimes(1);
    expect(api.evaluate).toHaveBeenCalledWith(expect.objectContaining({ hintedSteps: [], hintUsage: { basic: 0, ai: 0 } }));
  });

  it('starts a new case from the review and compares the same skill across attempts', async () => {
    const params = { trackId: 'product', interviewType: 'product_strategy', industry: 'Маркетплейсы', difficulty: 'Начальный', variantId: 'portfolio' };
    const feedback = { skillId: 'validation', observation: 'Не хватило критерия проверки.', applied: false, assisted: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{
      id: 'origin', title: 'Пилот доставки', caseText: 'Первый кейс.', params,
      answers: { validation: 'Спрошу пользователей' },
      attempts: [{ answers: { validation: 'Спрошу пользователей' }, evaluation: review, practice: feedback, createdAt: '2026-11-23' }],
    }]));
    api.generate.mockResolvedValueOnce({
      caseText: '# Запуск подписки\nНовая задача', caseIntro: 'Команда сравнивает варианты.',
      variantId: 'monetization', focusSkill: 'validation',
      caseRoute: [{ id: 'skill_checkpoint', chapter: 4, chapterTitle: 'Решение', question: 'Какую проверку проведёшь?', longAnswer: true }],
    });
    api.evaluate.mockResolvedValueOnce({
      evaluation: review,
      practice: { skillId: 'validation', observation: 'Есть проверка и порог решения.', applied: true, assisted: false },
    });
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Посмотреть AI-разбор' }));
    fireEvent.click(screen.getByRole('button', { name: 'Потренировать этот навык' }));
    await screen.findByRole('heading', { name: 'Запуск подписки' });
    expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({
      focusSkill: 'validation', variantId: 'surprise', previousVariant: 'portfolio',
    }));
    expect(screen.getByText('Фокус тренировки · Проверка гипотез')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Сравню две группы по оплатам и зафиксирую порог.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByText('Есть проверка и порог решения.');
    expect(screen.getByText('Не хватило критерия проверки.')).toBeTruthy();
    expect(screen.getByText('Критерий выполнен · Без подсказок на этом шаге')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ещё кейс на этот навык' })).toBeTruthy();
    expect(api.evaluate).toHaveBeenCalledWith(expect.objectContaining({ focusSkill: 'validation', hintedSteps: [] }));
  });

  it('shows eight variants per direction and submits the chosen training', async () => {
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByLabelText('02 / Отрасль');
    for (const type of INTERVIEWS) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(type.label) }));
      expect(within(screen.getByLabelText('Вариант тренировки')).getAllByRole('option')).toHaveLength(9);
    }
    expect(INTERVIEWS).toHaveLength(6);
    fireEvent.change(screen.getByLabelText('Вариант тренировки'), { target: { value: 'behavior' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByRole('heading', { name: 'Твой ход' });
    expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({
      interviewType: 'product_segmentation', variantId: 'behavior',
    }));
  });

  it('counts revealed hints once, persists AI hints and reports the score adjustment', async () => {
    await newCase();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Мой первый вывод' } });
    fireEvent.click(screen.getByRole('button', { name: 'Обычная подсказка · −1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть подсказку' }));
    fireEvent.click(screen.getByRole('button', { name: 'Обычная подсказка' }));
    api.coach.mockRejectedValueOnce(new Error('Сбой')).mockResolvedValueOnce({ message: 'Уточни, для кого актуальна проблема.' });
    fireEvent.click(screen.getByRole('button', { name: 'ИИ-подсказка · −2' }));
    await screen.findByText('Сбой');
    fireEvent.click(screen.getByRole('button', { name: 'ИИ-подсказка · −2' }));
    await screen.findByText('Уточни, для кого актуальна проблема.');
    expect(api.coach).toHaveBeenLastCalledWith(expect.objectContaining({ stepHint: true, stepId: 'problem', answerText: 'Мой первый вывод' }));
    cleanup(); render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Уточни, для кого актуальна проблема.')).toBeTruthy();
    fillCase();
    api.evaluate.mockResolvedValueOnce({
      evaluation: review, score: { quality: 84, final: 81, hintPenalty: 3, hints: { basic: 1, ai: 1 } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByText('81 из 100');
    expect(api.evaluate).toHaveBeenLastCalledWith(expect.objectContaining({ hintUsage: { basic: 1, ai: 1 } }));
  });

  it('submits a saved story without a separate intro', async () => {
    const caseText = 'Сохранённое условие.';
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{
      id: 'saved-story', title: 'Кейс', caseText,
      caseRoute: [{ id: 'practice_final', chapter: 4, question: 'Какое решение предложишь?' }],
      params: { interviewType: 'product_sense' }, answers: { practice_final: 'Запущу пилот.' }, attempts: [],
    }]));
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    expect(api.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      caseText, answers: { practice_final: 'Запущу пилот.' },
    }));
  });

  it('reveals only the chosen story branch and restores the new path after reloading', async () => {
    const chapter = { chapter: 1, chapterTitle: 'Первый выбор' };
    const caseRoute = [
      { ...chapter, id: 'choose', question: 'Что запросишь?', options: ['Спрос', 'Ресурсы'], nextByAnswer: { Спрос: 'demand', Ресурсы: 'team' } },
      { ...chapter, id: 'demand', question: 'Что скажешь о спросе?', evidence: 'В листе ожидания 80 заявок.', nextStepId: 'final' },
      { ...chapter, id: 'team', question: 'Что скажешь о ресурсах?', evidence: 'Доступен один аналитик.', nextStepId: 'final' },
      { chapter: 4, chapterTitle: 'Решение', id: 'final', question: 'Напиши рекомендацию.', longAnswer: true },
    ];
    api.generate.mockResolvedValueOnce({ caseText: '# Пилот\nВ листе ожидания 80 заявок. Доступен один аналитик.', caseIntro: 'Команда обсуждает запуск.', caseRoute });
    render(<MvpApp initialScreen="library"/>);
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
    cleanup(); render(<MvpApp initialScreen="library"/>);
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


  it('makes the first question actionable in a saved marketplace case without inventing numbers', () => {
    const title = 'Добавление функционала для увеличения конверсии на маркетплейсе';
    const caseIntro = 'Маркетплейс привлекает новых покупателей, но до покупки доходит мало людей.';
    const caseRoute = [{ id: 'variant_open', question: 'какие функции маркетплейса могут увеличить конверсию в покупки?', chapter: 1 }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{
      id: 'marketplace-case', title, caseIntro, caseText: caseIntro, caseRoute,
      params: { interviewType: 'product_sense' }, answers: { variant_open: 'Проверю переход к оплате.' }, attempts: [],
    }]));
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('heading', { name: /Где новым покупателям/ })).toBeTruthy();
    const context = screen.getByRole('region', { name: 'Данные для текущего шага' });
    expect(context.textContent).toBe(caseIntro);
    expect(screen.getByText(/Назови шаг, одно возможное препятствие и сравнение/)).toBeTruthy();
    expect(screen.getByRole('textbox').value).toBe('Проверю переход к оплате.');
  });

  it('restores a case-specific route and reviews answers to its own questions', async () => {
    const evidence = '| Версия | Ошибки |\n| --- | --- |\n| Новая | 14% |';
    const caseRoute = [
      { id: 'release_view', question: 'Какой срез запросишь?', hint: 'Выбери вариант.', options: ['По версиям', 'По регионам'] },
      { id: 'release_read', question: 'Какой вывод сделаешь?', evidence },
    ];
    api.generate.mockResolvedValueOnce({ caseText: `# Проблема после релиза\n\n**Дополнительный срез данных**\n\n${evidence}`, caseRoute });
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: /Почему падает конверсия/ }));
    await screen.findByLabelText('02 / Отрасль');
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    await screen.findByText('Шаг 1 из 2');
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'По версиям' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(within(screen.getByRole('region', { name: 'Данные для текущего шага' })).getByRole('table')).toBeTruthy();
    expect(openCondition().getByRole('table')).toBeTruthy();
    closeCondition();
    cleanup(); render(<MvpApp initialScreen="library"/>);
    expect(screen.getByText('1 из 2 ответов')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Шаг 2 из 2')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Проверю ошибки новой версии' } });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    expect(api.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      caseRoute: [
        { id: 'release_view', question: 'Какой срез запросишь?' },
        { id: 'release_read', question: 'Какой вывод сделаешь?', evidence },
      ],
      answers: { release_view: 'По версиям', release_read: 'Проверю ошибки новой версии' },
    }));
  });

  it('includes archived cases when generating and refuses a repeated condition', async () => {
    await newCase();
    const [previous] = JSON.parse(localStorage.getItem(STORAGE_KEY));
    cleanup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...previous, archivedAt: new Date().toISOString() }]));
    render(<MvpApp initialScreen="library"/>);
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
    const error = within(await screen.findByRole('alert'));
    expect(error.getByText('Временная ошибка')).toBeTruthy();
    expect(error.getByText('Ответы сохранены в этом браузере.')).toBeTruthy();
    cleanup(); render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Шаг 8 из 8')).toBeTruthy();
    expect(screen.getByRole('textbox').value).toBe('Мой ответ на вопрос 8');
    fireEvent.click(screen.getByRole('button', { name: /^Шаг 1:/ }));
    expect(screen.getByLabelText(/1\. Какую задачу пользователя/).value).toBe('Мой черновик');
    fireEvent.click(screen.getByRole('button', { name: /^Шаг 8:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    expect(api.evaluate).toHaveBeenLastCalledWith(expect.objectContaining({
      answers: expect.objectContaining({ problem: 'Мой черновик' }),
    }));
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
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name:'Продолжить' }));
    expect(screen.getByText('Шаг 2 из 8')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name:/^Шаг 1:/ }));
    expect(screen.getByRole('textbox').value).toBe('Старая мысль');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].answers.risk).toBe('Старый риск');
  });
  it('retries generation without creating empty cases or duplicate submissions', async () => {
    api.generate.mockRejectedValueOnce(new Error('Генерация недоступна'));
    render(<MvpApp initialScreen="library"/>);
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
    render(<MvpApp initialScreen="library"/>);
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
    cleanup(); render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Карточки' }));
    fireEvent.click(screen.getByRole('button', { name: 'Мои карточки · 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'В моих карточках · убрать' }));
    expect(screen.getByRole('button', { name: 'Мои карточки · 0' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('htc_saved_theory_v1'))).toEqual([]);
  });
  it('recovers config loading and handles invalid storage', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    api.config.mockRejectedValueOnce(new Error('Offline'));
    render(<MvpApp initialScreen="library"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать кейс' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Повторить загрузку' }));
    await waitFor(() => expect(screen.getByLabelText('02 / Отрасль').value).toBe('Маркетплейсы'));
  });
});
