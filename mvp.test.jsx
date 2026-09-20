import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MvpApp, { STORAGE_KEY } from './MvpApp.jsx';
import { api } from './api/client.js';
vi.mock('./api/client.js', () => ({ api: { config: vi.fn(), generate: vi.fn(), evaluate: vi.fn() } }));
const review = JSON.stringify({ summary: 'Проверь конверсию по этапам.', strengths: ['Есть гипотеза'], improvements: ['Нет расчёта'], topTips: ['Посчитай воронку'] });
beforeEach(() => {
  localStorage.clear(); vi.resetAllMocks(); window.scrollTo = vi.fn();
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
describe('MVP core flow', () => {
  it('generates, saves, evaluates and keeps immutable versions when improving', async () => {
    await newCase();
    expect(api.generate).toHaveBeenCalledWith(expect.objectContaining({ mvp: true, industry: 'Маркетплейсы' }));
    expect(screen.queryByText('Уроки')).toBeNull();
    fireEvent.change(screen.getByLabelText(/1\. Какую задачу пользователя/), { target: { value: 'Падает конверсия' } });
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByRole('heading', { name: 'Разбор решения' });
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить решение' }));
    expect(screen.getByRole('button', { name: 'Проверить новую версию' }).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/1\. Какую задачу пользователя/), { target: { value: 'Конверсия упала на 20% относительно исходной' } });
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
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    expect(api.evaluate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/1\. Какую задачу пользователя/), { target: { value: 'Мой черновик' } });
    api.evaluate.mockRejectedValueOnce(new Error('Временная ошибка'));
    fireEvent.click(screen.getByRole('button', { name: 'Получить ИИ-разбор' }));
    await screen.findByText('Временная ошибка');
    cleanup(); render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByLabelText(/1\. Какую задачу пользователя/).value).toBe('Мой черновик');
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
    fireEvent.click(screen.getByRole('button', { name: 'Теория' }));
    expect(screen.getByRole('heading', { name: 'Теория для практики' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к решению' }));
    expect(screen.getByLabelText(/1\. Какую задачу пользователя/).value).toBe('Сохранённая мысль');
  });
  it('saves a case material, restores it after reload and removes it from saved theory', async () => {
    await newCase();
    const summary = screen.getByText('Какие материалы могут понадобиться');
    const panel = summary.closest('details');
    panel.open = true;
    fireEvent.click(within(panel).getAllByRole('button', { name: 'Добавить в мою теорию' })[0]);
    fireEvent.click(within(panel).getByRole('button', { name: 'Открыть мою теорию' }));
    expect(screen.getByRole('button', { name: 'Моя теория · 1' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Сегментация' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Конверсия' })).toBeNull();
    cleanup(); render(<MvpApp/>);
    fireEvent.click(screen.getByRole('button', { name: 'Теория' }));
    fireEvent.click(screen.getByRole('button', { name: 'Моя теория · 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'В моей теории · убрать' }));
    expect(screen.getByRole('button', { name: 'Моя теория · 0' })).toBeTruthy();
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
