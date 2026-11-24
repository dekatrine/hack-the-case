import { SKILL_PATH } from './skillPath.js';
import { BOOK_CHAPTERS } from '../bookData.js';

// Interview skill (rubric dimension id) → the lesson and the book chapter that train it.
export const SKILL_LINKS = {
  structure: { lesson: 'metrics-tree', chapter: 14 },
  data: { lesson: 'funnel', chapter: 14 },
  hypotheses: { lesson: 'ab-test', chapter: 10 },
  choice: { lesson: 'final-case', chapter: 7 },
  metrics: { lesson: 'conversion', chapter: 14 },
  risks: { lesson: 'diagnosis', chapter: 24 },
  communication: { lesson: 'final-case', chapter: 6 },
};

export function linksForSkill(id) {
  const link = SKILL_LINKS[id];
  if (!link) return null;
  const lesson = SKILL_PATH.lessons.find(item => item.id === link.lesson);
  const chapter = BOOK_CHAPTERS.find(item => item.number === link.chapter);
  if (!lesson || !chapter) return null;
  return { lessonId: lesson.id, lessonTitle: lesson.title, chapter: chapter.number, chapterTitle: chapter.title };
}
