import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CleanHome from './CleanHome.jsx';

describe('CleanHome', () => {
  it('renders hero and stats', () => {
    render(<CleanHome onNewCase={() => {}} onOpenLearn={() => {}} onOpenInterview={() => {}} onOpenLegacy={() => {}} />);
    expect(screen.getByText('Готов разобрать кейс сегодня?')).toBeTruthy();
    expect(screen.getByText('Начать новый кейс →')).toBeTruthy();
    expect(screen.getByText('Библиотека уроков')).toBeTruthy();
    // Навигация (в т.ч. ссылка на PMQuest) теперь в общем каркасе CleanShell, а не в CleanHome.
  });
});
