import { expect, it } from 'vitest';
import { linksForSkill, SKILL_LINKS } from './skillLinks.js';

it('every graded skill leads to an existing lesson and book chapter', () => {
  const ids = ['structure', 'data', 'hypotheses', 'choice', 'metrics', 'risks', 'communication'];
  for (const id of ids) {
    const links = linksForSkill(id);
    expect(links, id).toBeTruthy();
    expect(links.lessonTitle).toBeTruthy();
    expect(links.chapterTitle).toBeTruthy();
  }
  expect(Object.keys(SKILL_LINKS).sort()).toEqual([...ids].sort());
  expect(linksForSkill('unknown')).toBeNull();
});
