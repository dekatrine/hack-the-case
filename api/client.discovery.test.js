import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./analytics.js', () => ({track: vi.fn()}));
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});
const response = (status, type, data) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {get: (name) => name === 'content-type' ? type : null},
  json: async () => data,
});
describe('local API discovery', () => {
  it('ignores HTML served by an outdated Vite instance and finds FastAPI on 8001', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      calls.push(url);
      if (url === '/api/config') return response(200,'text/html','<html>old Vite</html>');
      if (url === 'http://127.0.0.1:8001/api/config') return response(200,'application/json',{industries:['Маркетплейсы'],difficultyLevels:{Начальный:'test'}});
      if (url === 'http://127.0.0.1:8001/api/cases/generate') return response(200,'application/json',{caseText:'Кейс'});
      throw new Error('not online');
    }));
    const {api} = await import('./client.js');
    expect((await api.config()).industries).toEqual(['Маркетплейсы']);
    expect((await api.generate({industry:'Маркетплейсы'})).caseText).toBe('Кейс');
    expect(calls).toEqual(['/api/config','http://127.0.0.1:8001/api/config','http://127.0.0.1:8001/api/cases/generate']);
  });
  it('falls back when old Vite proxy returns a plain-text 500', async () => {
    vi.stubGlobal('fetch',vi.fn(async url => url==='/api/config'
      ? response(500,'text/plain',{})
      : response(200,'application/json',{industries:['E-commerce / Маркетплейсы'],difficultyLevels:{Начальный:'test'}})));
    const {api}=await import('./client.js');
    expect((await api.config()).industries.length).toBe(1);
  });
});
