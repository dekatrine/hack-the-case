import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DecisionChallenge from './DecisionChallenge.jsx';
vi.mock('../api/analytics.js',()=>({track:vi.fn()}));
afterEach(()=>cleanup());

describe('Business Lab decision scenario',()=>{
  it('enforces budget, shows consequences and provides a full explanation',()=>{
    const done=vi.fn();
    render(<DecisionChallenge onExit={()=>{}} onComplete={done}/>);
    fireEvent.click(screen.getByRole('button',{name:/Упростить checkout/}));
    fireEvent.click(screen.getByRole('button',{name:/Вернуть пользователей через CRM/}));
    expect(screen.getByRole('button',{name:/Запустить платное привлечение/}).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button',{name:/Рассчитать последствия/}));
    expect(screen.getByText(/55\s*000 ₽/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Проверить ошибки и воронку checkout'}));
    fireEvent.click(screen.getByRole('button',{name:/Сравню прирост валовой прибыли/}));
    fireEvent.click(screen.getByRole('button',{name:/Получить разбор/}));
    expect(screen.getByText('Разбор решения')).toBeTruthy();
    expect(done).toHaveBeenCalledWith(expect.objectContaining({checkValid:true,reasonCorrect:true}));
    fireEvent.click(screen.getByRole('button',{name:/Попробовать другую стратегию/}));
    expect(screen.getByRole('button',{name:/Рассчитать последствия/}).disabled).toBe(true);
  });
});
