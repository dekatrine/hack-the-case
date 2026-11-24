import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Interview from './Interview.jsx';
import { advance, createRun, skeletons } from './engine.js';
import { saveRuns } from './storage.js';

vi.mock('../api/analytics.js', () => ({ track: vi.fn() }));
vi.mock('../api/sync.js', () => ({ ensureAuth: async () => {}, apiFetch: async () => { throw new Error('Offline'); } }));
vi.mock('../api/client.js', () => ({ api: { interviewStory: async () => { throw new Error('Offline'); }, generate: vi.fn(), evaluate: vi.fn() } }));
afterEach(cleanup);

const weak = ['Не знаю.', 'Нужно посмотреть аналитику и принять решение.', 'Сначала увеличим бюджет. Потом разберёмся.', 'Результат очевиден, проверять ничего не буду.'];
function weakRun() {
  const skeleton = skeletons[0];
  let run = { ...createRun(skeleton, []), status: 'active' };
  for (let i = 0; run.queue.length && i <= skeleton.max; i += 1) {
    const move = run.queue[0];
    if (move.evidence && !move.public) run = { ...run, hints: { ...run.hints, [move.id]: true } };
    const options = move.options === 'segments' ? run.seed.groups : move.options;
    run = advance(run, weak[i % weak.length], options?.[options.length - 1] || '', 2000);
  }
  return run;
}

it('links the weakest skill of a finished interview to its lesson and book chapter', () => {
  localStorage.clear(); window.scrollTo = vi.fn();
  const run = weakRun();
  expect(run.status).toBe('finished');
  saveRuns([run]);
  const onStudy = vi.fn();
  render(<Interview onExit={vi.fn()} onStudy={onStudy} start={{ open: run.id }}/>);
  const region = screen.getByRole('region', { name: 'Чтобы подтянуть слабое место' });
  fireEvent.click([...region.querySelectorAll('button')].find(b => b.textContent.startsWith('Урок:')));
  expect(onStudy).toHaveBeenCalledWith('learning', { lessonId: expect.any(String) });
  fireEvent.click([...region.querySelectorAll('button')].find(b => b.textContent.startsWith('Глава')));
  expect(onStudy).toHaveBeenLastCalledWith('theory', { chapter: expect.any(Number) });
});
