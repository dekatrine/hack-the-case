import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookTheoryPage from './BookTheoryPage.jsx';
import MvpApp from './MvpApp.jsx';
import { api } from './api/client.js';
vi.mock('./api/client.js', () => ({ api: { config: vi.fn() } }));
beforeEach(() => {
  localStorage.clear(); window.scrollTo = vi.fn();
  api.config.mockResolvedValue({ industries: ['Маркетплейсы'], difficultyLevels: { Начальный: '' } });
});
afterEach(cleanup);
it('navigates book chapters and searches the table of contents', async () => {
  render(<BookTheoryPage savedIds={[]} onToggle={() => {}}/>);
  expect(screen.getByRole('button', { name: '← Предыдущая глава' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Следующая глава →' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Продуктовый менеджмент в действии: стратегии, инструменты и практики' })).toBeTruthy());
  fireEvent.change(screen.getByLabelText('Найти главу'), { target: { value: 'Velocity' } });
  fireEvent.click(screen.getByRole('button', { name: /15 Velocity/ }));
  expect(screen.getByRole('heading', { name: 'Velocity и Capacity в продуктовом менеджменте' })).toBeTruthy();
  expect(screen.getByText(/Модуль 15 книги · с. 372–381/)).toBeTruthy();
});
it('opens the source chapter from a book card and saves it into My cards', async () => {
  render(<MvpApp/>);
  fireEvent.click(screen.getByRole('button', { name: 'Карточки' }));
  fireEvent.change(screen.getByLabelText('Поиск по карточкам'), { target: { value: 'Velocity' } });
  fireEvent.click(screen.getByRole('button', { name: 'Читать главу 15 →' }));
  expect(screen.getByRole('heading', { name: 'Теория по главам' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Добавить в мои карточки' }));
  fireEvent.click(screen.getByRole('button', { name: 'Карточки' }));
  fireEvent.click(screen.getByRole('button', { name: 'Мои карточки · 1' }));
  expect(screen.getByRole('heading', { name: 'Velocity и Capacity' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Сегментация' })).toBeNull();
  expect(JSON.parse(localStorage.getItem('htc_saved_theory_v1'))).toEqual(['book-15']);
});
