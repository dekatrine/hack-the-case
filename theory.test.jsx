import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TheoryPage from './TheoryPage.jsx';
afterEach(cleanup);
it('filters by topic, searches an abbreviation and resets empty results', () => {
  render(<TheoryPage/>);
  fireEvent.click(screen.getByRole('button', { name: 'Экономика продукта' }));
  expect(screen.getByRole('heading', { name: 'GMV, выручка и прибыль' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Сегментация' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Поиск по карточкам'), { target: { value: 'xyzxyz' } });
  expect(screen.getByRole('heading', { name: 'Ничего не найдено' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить поиск и фильтр' }));
  fireEvent.change(screen.getByLabelText('Поиск по карточкам'), { target: { value: 'JTBD' } });
  expect(screen.getByRole('heading', { name: 'Jobs to Be Done (JTBD)' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'GMV, выручка и прибыль' })).toBeNull();
});
