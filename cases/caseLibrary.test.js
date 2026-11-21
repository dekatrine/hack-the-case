import { describe, expect, it } from 'vitest';
import { answeredCount, caseStats, caseStatus, duplicateAsNewAttempt, filterCases } from './caseLibrary.js';
const base=(id,overrides={})=>({id,caseText:'В маркетплейсе снизилась конверсия',title:id,answers:{},attempts:[],params:{interviewType:'product_execution',industry:'Маркетплейсы'},createdAt:'2026-11-20T00:00:00Z',...overrides});
describe('case library compatibility',()=>{
  it('supports old cases without optional archive or update fields',()=>{
    const old=base('old',{answers:{problem:'Гипотеза'}});
    expect(caseStatus(old)).toBe('draft');
    expect(answeredCount(old)).toBe(1);
    expect(caseStats([old])).toEqual({total:1,reviewed:0,inProgress:1,archived:0});
  });
  it('does not lose historic evaluation versions or mistake answers',()=>{
    const item=base('reviewed',{answers:{problem:'Ответ'},attempts:[{answers:{problem:'Ответ'},evaluation:'AI feedback'}]});
    expect(caseStatus(item)).toBe('reviewed');
    const retry=duplicateAsNewAttempt(item,'new-id','2026-11-21T00:00:00Z');
    expect(retry.id).toBe('new-id');
    expect(retry.sourceCaseId).toBe('reviewed');
    expect(retry.answers).toEqual({});
    expect(retry.attempts).toEqual([]);
    expect(item.attempts).toHaveLength(1);
  });
  it('searches/filter/sorts and keeps archived cases recoverable',()=>{
    const a=base('First',{title:'Конверсия в заказ',createdAt:'2026-11-20T00:00:00Z'});
    const b=base('Second',{title:'Рост прибыли',params:{interviewType:'product_strategy'},createdAt:'2026-11-21T00:00:00Z'});
    const archived=base('Old',{archivedAt:'2026-11-21T00:00:00Z'});
    expect(filterCases([a,b,archived]).map(x=>x.id)).toEqual(['Second','First']);
    expect(filterCases([a,b,archived],{query:'в заказ'}).map(x=>x.id)).toEqual(['First']);
    expect(filterCases([a,b,archived],{type:'product_strategy'}).map(x=>x.id)).toEqual(['Second']);
    expect(filterCases([a,b,archived],{status:'archived'}).map(x=>x.id)).toEqual(['Old']);
    expect(filterCases([a,b,archived],{sort:'oldest'}).map(x=>x.id)).toEqual(['First','Second']);
  });
});
