import { assessTurn, RUBRIC_VERSION } from './rubric.js';
import { chooseSeed, matchingClues } from './seeds.js';

export const skeletons = Object.values(import.meta.glob('./skeletons/*.json', { eager: true, import: 'default' }));
export const plan = skeleton => skeleton.phases.flatMap(phase => phase.turns.map(turn => ({ ...turn, phase: phase.id })));

const scope = skeletons.find(skeleton => skeleton.id === 'diagnosis')?.phases
  .flatMap(phase => phase.turns).find(turn => turn.id === 'scope');

export function currentTurn(run) {
  const move = run?.queue[0];
  // Saved interviews keep a snapshot of the original questions.
  if (!scope || run?.skeleton.id !== 'diagnosis') return move;
  if (move?.id === 'scope') return { ...move, prompt: scope.prompt, hint: scope.hint, checks: scope.checks };
  if (move?.id === 'scope_clarify') {
    return { ...move, prompt: scope.hint, hint: scope.hint, checks: scope.checks, reply: scope.reply };
  }
  return move;
}

export function createRun(skeleton, previous, now = Date.now()) {
  return {
    id: crypto.randomUUID(), skeleton, rubricVersion: RUBRIC_VERSION, seed: chooseSeed(skeleton, previous),
    queue: plan(skeleton), history: [], map: [], opened: [], hints: {}, clarified: [],
    draft: '', choice: '', elapsed: 0, status: 'briefing', createdAt: now, updatedAt: now,
  };
}

export function targetEntry(run, move) {
  let selected = run.map.find(entry => entry.id === move.target);
  for (const entry of run.map) {
    if (selected && entry.revises === selected.id) selected = entry;
  }
  return selected || (move.kind === 'CHALLENGE' ? run.map.at(-1) : null);
}

function mapEntry(run, move, answer, choice) {
  const revisedKey = answer.match(/^пересматриваю\s+([^:]+):\s*(.+)$/i);
  const previous = revisedKey && [...run.map].reverse().find(entry => entry.label.toLowerCase() === revisedKey[1].trim().toLowerCase());
  const quote = answer.length > 160 ? answer.slice(0, 160).replace(/\s+\S*$/, '') : answer;
  return {
    id: move.id, phase: move.phase, label: move.label, value: choice || quote, quote,
    ...(previous ? { revises: previous.id, label: previous.label, value: revisedKey[2] } : {}),
  };
}

export function advance(run, answer, choice, tookMs, now = Date.now()) {
  const move = currentTurn(run);
  if (!move || run.status !== 'active') return run;
  const queue = run.queue.slice(1);
  const text = answer.trim() || choice;
  if (!text || (move.justify && (!answer.trim() || !choice))) return run;
  const matches = matchingClues(run, move, text);
  const newlyOpened = matches.filter(clue => !run.opened.includes(clue.id));
  if (move.evidence && !move.public && !matches.length && !run.hints[move.id]) {
    return { ...run, requestError: 'Уточни срез и показатель. Можно открыть подсказку и продолжить.' };
  }
  const assessment = assessTurn(run, move, text, choice, matches);
  const target = move.target ? targetEntry(run, move) : null;
  const entry = { id: move.id, phase: move.phase, kind: move.kind, label: move.label, answer: text, choice, assessment, tookMs, opened: newlyOpened.map(clue => clue.id), ...(target ? { targetId: target.id, targetQuote: target.quote } : {}) };
  const history = [...run.history, entry];
  const clarified = [...run.clarified];
  if (assessment.grade === 3 && queue[0]?.optional && history.length + queue.length > run.skeleton.min) {
    queue.shift();
  } else if (assessment.grade <= 1 && !['CLARIFY', 'CHALLENGE', 'DEMAND'].includes(move.kind)
      && !run.clarified.includes(move.phase) && history.length + queue.length < run.skeleton.max) {
    const existing = queue.findIndex(turn => turn.phase === move.phase && turn.optional);
    const followUp = {
      ...move, id: `${move.id}_clarify`, kind: 'CLARIFY', label: `Уточнение · ${move.label}`,
      prompt: move.hint, target: move.id, hint: move.hint, options: undefined, justify: false,
      fact: undefined, evidence: undefined, reply: undefined, optional: false,
    };
    if (existing >= 0) queue.splice(existing, 1);
    queue.unshift(followUp);
    clarified.push(move.phase);
  }
  const nextMap = mapEntry(run, move, text, choice);
  const map = [...run.map, nextMap, ...newlyOpened.map(clue => ({
    id: `evidence_${clue.id}`, phase: move.phase, label: 'Улика', value: clue.title, quote: text,
  }))];
  return {
    ...run, updatedAt: now, queue, history, map, clarified,
    opened: [...run.opened, ...entry.opened], draft: '', choice: '', requestError: '',
    elapsed: run.elapsed + tookMs, status: queue.length ? 'active' : 'finished',
    lastReply: move.reply && assessment.grade >= 2 ? run.seed.replies[move.reply] : '',
  };
}
