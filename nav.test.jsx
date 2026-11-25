import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import MvpApp from './MvpApp.jsx';
import { api } from './api/client.js';
vi.mock('./api/client.js', () => ({ api: { config: vi.fn() } }));
beforeEach(() => {
  localStorage.clear(); window.scrollTo = vi.fn();
  api.config.mockResolvedValue({ industries: ['Маркетплейсы'], difficultyLevels: { Начальный: '' } });
});
afterEach(cleanup);
const nav = () => screen.getByRole('navigation', { name: 'Основная навигация' });
const click = name => fireEvent.click(screen.getByRole('button', { name }));

it('has three sections and the new case button in the header', () => {
  render(<MvpApp initialScreen="library"/>);
  const labels = [...nav().querySelectorAll('button')].map(b => b.textContent);
  expect(labels).toEqual(['Главная', 'Практика', 'Учёба', 'Новый кейс']);
});
it('switches between study tabs without leaving the section', () => {
  render(<MvpApp initialScreen="library"/>);
  click('Учёба');
  expect(screen.getByRole('button', { name: 'Путь' }).getAttribute('aria-pressed')).toBe('true');
  click('Теория');
  expect(screen.getByRole('heading', { name: 'Теория по главам' })).toBeTruthy();
  click('Карточки');
  expect(screen.getByRole('heading', { name: 'Карточки для практики' })).toBeTruthy();
  expect(within(nav()).getByRole('button', { name: 'Учёба' }).getAttribute('aria-current')).toBe('page');
});
it('shows interviews, cases and history as tabs of Practice', () => {
  render(<MvpApp initialScreen="library"/>);
  click('Собесы');
  expect(screen.getByRole('button', { name: 'Собесы' }).getAttribute('aria-pressed')).toBe('true');
  click('История');
  expect(screen.getByRole('button', { name: 'История' }).getAttribute('aria-pressed')).toBe('true');
  click('Кейсы');
  expect(screen.getByRole('button', { name: 'Кейсы' }).getAttribute('aria-pressed')).toBe('true');
});

it('maps every direction to an existing ready-made interview', async () => {
  const { SKELETON_BY_DIRECTION } = await import('./MvpApp.jsx');
  const { skeletons } = await import('./interviews/engine.js');
  const ids = skeletons.map(item => item.id);
  expect(Object.keys(SKELETON_BY_DIRECTION)).toHaveLength(6);
  for (const id of Object.values(SKELETON_BY_DIRECTION)) expect(ids).toContain(id);
});
