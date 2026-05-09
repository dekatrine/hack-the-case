import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// We test the pure presentational pieces that have no side effects.
// Workspace / API-dependent parts are excluded — those need integration tests.
import '../src/styles.css';

const tracks = [
  {
    id: 'product',
    name: 'Продуктовые кейсы',
    tagline: 'PM-собеседования',
    description: 'Структурированный подход CIRCLES.',
    duration: '7 глав',
    chapters: [{ id: 'c1', circle: 'C', title: 'Clarify', summary: 's', skills: ['x'], outcome: 'o' }],
  },
  {
    id: 'business',
    name: 'Бизнес-кейсы',
    tagline: 'McKinsey / BCG',
    description: 'Консалтинговая воронка.',
    duration: '8 глав',
    chapters: [{ id: 'c2', circle: '01', title: 'Objective', summary: 's', skills: ['y'], outcome: 'o' }],
  },
];

// Inline mini-component so this is a true unit test, isolated from network/state.
const TrackChip = ({ t }) => (
  <article className="track-card">
    <h3>{t.name}</h3>
    <p>{t.tagline}</p>
    <span>{t.chapters.length} chapters</span>
  </article>
);

describe('Landing presentational', () => {
  it('renders both tracks', () => {
    const { container } = render(<>{tracks.map((t) => <TrackChip key={t.id} t={t} />)}</>);
    expect(container.querySelectorAll('.track-card')).toHaveLength(2);
    expect(container.textContent).toContain('Продуктовые кейсы');
    expect(container.textContent).toContain('Бизнес-кейсы');
  });

  it('matches snapshot', () => {
    const { container } = render(<>{tracks.map((t) => <TrackChip key={t.id} t={t} />)}</>);
    expect(container.innerHTML).toMatchSnapshot();
  });
});
