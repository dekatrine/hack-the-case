import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ConditionAssistant from './ConditionAssistant.jsx';
import { api } from './api/client.js';
vi.mock('./api/client.js', () => ({ api: { explainCondition: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it('opens, explains and sends only the condition and question', async () => {
  api.explainCondition.mockResolvedValue({ message: 'GMV — общая стоимость проданных товаров.' });
  render(<ConditionAssistant caseText="Условие"/>);
  fireEvent.click(screen.getByRole('button', { name: /Разобраться в условии/ }));
  fireEvent.change(screen.getByLabelText('Что непонятно в условии?'), { target: { value: 'Что такое GMV?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Объяснить' }));
  await screen.findByText('GMV — общая стоимость проданных товаров.');
  expect(api.explainCondition).toHaveBeenCalledWith({ caseText: 'Условие', question: 'Что такое GMV?' });
});
it('preserves question on error and allows retry', async () => {
  api.explainCondition.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce({ message: 'Определение' });
  render(<ConditionAssistant caseText="Условие"/>);
  fireEvent.click(screen.getByRole('button', { name: /Разобраться в условии/ }));
  fireEvent.change(screen.getByLabelText('Что непонятно в условии?'), { target: { value: 'Что такое retention?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Объяснить' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Что непонятно в условии?').value).toBe('Что такое retention?');
  fireEvent.click(screen.getByRole('button', { name: 'Объяснить' }));
  await screen.findByText('Определение');
});
