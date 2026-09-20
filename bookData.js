import chapters from './bookTheory.json';
export const BOOK = { author: 'А. Н. Баланов', title: 'Продакт-менеджмент', publisher: 'Лань', year: 2024 };
export const BOOK_CHAPTERS = chapters;
// Place the book's concepts among the existing themes; retain stable IDs of older cards.
const groups = ['delivery','strategy','delivery','strategy','delivery','delivery','strategy','delivery','delivery','sense','sense','experiments','sense','analytics','delivery','sense','economics','contexts','contexts','contexts','contexts','contexts','strategy','strategy','career','economics','career'];
export const BOOK_CARDS = chapters.map((c,i) => ({
  id: c.cardId, group: groups[i], title: c.concept, definition: c.summary,
  example: c.example, types: c.types, application: c.application, mistake: c.mistake,
  source: `${BOOK.author}. «${BOOK.title}», ${BOOK.year}. Модуль ${c.number}, с. ${c.start}–${c.end}.`,
  chapterNumber: c.number,
}));
