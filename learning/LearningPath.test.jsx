import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LearningPath from './LearningPath.jsx';

vi.mock('../api/analytics.js', () => ({ track: vi.fn() }));
const KEY = 'htc_learning_path_v1';

beforeEach(() => localStorage.clear());

describe('Product metrics learning path', () => {
  it('shows one available lesson and locks later lessons', () => {
    render(<LearningPath onOpenCases={() => {}} />);
    expect(screen.getByRole('button', { name: /Что такое конверсия/ }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: /Где теряются пользователи/ }).disabled).toBe(true);
  });

  it('explains wrong answers, allows retry, unlocks next lesson and persists mistakes', async () => {
    render(<LearningPath onOpenCases={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Что такое конверсия/ }));
    expect(screen.getByText(/CR = целевые действия/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Попробовать/ }));
    fireEvent.click(screen.getByRole('button', { name: '1%' }));
    fireEvent.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    expect(screen.getByText(/Пока не так/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Повторить попытку/ }));
    fireEvent.click(screen.getByRole('button', { name: '10%' }));
    fireEvent.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    expect(screen.getByText(/Верно!/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Завершить урок/ }));
    await waitFor(() => {
      const progress = JSON.parse(localStorage.getItem(KEY));
      expect(progress.completed).toContain('conversion');
      expect(progress.mistakes.conversion).toBe(1);
    });
    expect(screen.getByRole('button', { name: /Где теряются пользователи/ }).disabled).toBe(false);
  });

  it('shows a visual chart and progresses through all final-case questions', () => {
    localStorage.setItem(KEY, JSON.stringify({ completed: ['conversion','funnel','metrics-tree','ab-test','diagnosis'], mistakes: {} }));
    render(<LearningPath onOpenCases={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Мини-кейс: спасаем воронку/ }));
    fireEvent.click(screen.getByRole('button', { name: /Попробовать/ }));
    expect(screen.getByRole('img', { name: /Оплата \(нед. 2\): 50/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Корзина → оплата' }));
    fireEvent.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    fireEvent.click(screen.getByRole('button', { name: /Следующий вопрос/ }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    fireEvent.click(screen.getByRole('button', { name: /Следующий вопрос/ }));
    fireEvent.click(screen.getByRole('button', { name: /Проверить ошибки, способы оплаты/ }));
    fireEvent.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    fireEvent.click(screen.getByRole('button', { name: /Завершить мини-кейс/ }));
    expect(screen.getByText('6/6')).toBeTruthy();
  });
});
