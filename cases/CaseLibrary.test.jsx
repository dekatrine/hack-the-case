import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CaseLibrary from './CaseLibrary.jsx';
afterEach(()=>cleanup());
const item={id:'c1',title:'Падение конверсии',caseText:'Потери на оплате',params:{interviewType:'product_execution',industry:'Ритейл'},answers:{problem:'Низкая CR'},attempts:[],createdAt:'2026-11-20T00:00:00Z'};
describe('My Cases workspace',()=>{
  it('filters, archives and restores without destroying cases',()=>{
    const onArchive=vi.fn();
    const props={cases:[item],interviewTypes:[{id:'product_execution',label:'Аналитика'}],onArchive,onOpen:vi.fn(),onRetry:vi.fn(),onNew:vi.fn(),onLearn:vi.fn()};
    const view=render(<CaseLibrary {...props}/>);
    expect(screen.getByText('Падение конверсии')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox',{name:'Поиск кейсов'}),{target:{value:'неизвестный'}});
    expect(screen.getByText(/Нет кейсов по выбранным фильтрам/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Сбросить фильтры'}));
    fireEvent.click(screen.getByRole('button',{name:/В архив/}));
    expect(onArchive).toHaveBeenCalledWith(item,true);
    view.rerender(<CaseLibrary {...props} cases={[{...item,archivedAt:'2026-11-21T00:00:00Z'}]}/>);
    fireEvent.click(screen.getByRole('button',{name:/Архив/}));
    fireEvent.click(screen.getByRole('button',{name:/Восстановить/}));
    expect(onArchive).toHaveBeenCalledWith(expect.objectContaining({id:'c1'}),false);
  });
  it('keeps reviewed case versions and exposes a new attempt action',()=>{
    const onRetry=vi.fn();
    const review={...item,attempts:[{answers:{problem:'Низкая CR'},evaluation:'text'}]};
    render(<CaseLibrary cases={[review]} interviewTypes={[]} onOpen={vi.fn()} onNew={vi.fn()} onArchive={vi.fn()} onRetry={onRetry} onLearn={vi.fn()}/>);
    expect(screen.getByText('Есть AI-разбор')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/Новая попытка/}));
    expect(onRetry).toHaveBeenCalledWith(review);
  });
});
