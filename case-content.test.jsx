import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CaseContent from './CaseContent.jsx';
afterEach(cleanup);
describe('Generated case formatting', () => {
  it('renders company facts, headings, lists and tables without markdown markers', () => {
    const { container } = render(<CaseContent text={'**Компания:** BigMarket\n\n## Данные\n- Конверсия **8%**\n- Было 10%\n\n| Метрика | Значение |\n| --- | --- |\n| Заказы | 80 |'}/>);
    expect(screen.getByText('Компания')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Данные' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('cell', { name: '80' })).toBeTruthy();
    expect(container.textContent).not.toContain('**');
    expect(container.textContent).not.toContain('##');
  });
  it('keeps model HTML inert and preserves numerical operators', () => {
    const { container } = render(<CaseContent text={'<script>alert(1)</script>\nРасчёт: 5 * 2 = 10; x < 4.'}/>);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('5 * 2 = 10');
  });
});
