import { assessTurn, RUBRIC_VERSION } from './rubric.js';
import { chooseSeed, matchingClues } from './seeds.js';
import { nextConfiguredTurn } from './configured.js';

export const skeletons = Object.values(import.meta.glob('./skeletons/*.json', { eager: true, import: 'default' }));
export const plan = skeleton => skeleton.phases.flatMap(phase => phase.turns.map(turn => ({ ...turn, phase: phase.id })));

const currentPlans = new Map(skeletons.map(skeleton => [skeleton.id, new Map(plan(skeleton).map(turn => [turn.id, turn]))]));

export function currentTurn(run) {
  const move = run?.queue[0];
  if (!move) return move;
  // Preserve the saved route and choices while applying the current wording.
  const clarification = move.kind === 'CLARIFY';
  const originalId = clarification ? move.id.replace(/_clarify$/, '') : move.id;
  const current = currentPlans.get(run.skeleton.id)?.get(originalId);
  if (!current) return move;
  if (clarification) {
    return {
      ...move, label: `Уточнение · ${current.label}`, prompt: current.hint, hint: current.hint,
      checks: current.checks, reply: originalId === 'scope' ? current.reply : move.reply,
    };
  }
  return { ...move, label: current.label, prompt: current.prompt, hint: current.hint, checks: current.checks, optionLabels: current.optionLabels };
}

export function optionLabel(move, value) {
  return move.optionLabels?.[move.options.indexOf(value)] || value;
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
  return selected || (run.configured || move.kind === 'CHALLENGE' ? run.map.at(-1) : null);
}

function mapEntry(run, move, answer, choice) {
  const revisedKey = answer.match(/^пересматриваю\s+([^:]+):\s*(.+)$/i);
  const previous = revisedKey && [...run.map].reverse().find(entry => entry.label.toLowerCase() === revisedKey[1].trim().toLowerCase());
  const quote = answer.length > 160 ? answer.slice(0, 160).replace(/\s+\S*$/, '') : answer;
  const sentence = answer.split(/(?<=[.!?])\s/)[0];
  const short = sentence.length > 60 ? `${sentence.slice(0, 60).replace(/\s+\S*$/, '')}…` : sentence.replace(/[.!?]$/, '');
  const clarify = !run.configured && move.kind === 'CLARIFY' && move.target;
  return {
    id: clarify ? move.target : move.id, phase: move.phase, label: clarify ? move.label.replace(/^Уточнение · /, '') : move.label,
    value: optionLabel(move, choice) || short, quote,
    ...(previous ? { revises: previous.id, label: previous.label, value: revisedKey[2] } : {}),
  };
}

export function advance(run, answer, choice, tookMs, now = Date.now()) {
  const move = currentTurn(run);
  if (!move || run.status !== 'active') return run;
  const text = answer.trim() || choice;
  if (!text || (move.justify && (!answer.trim() || !choice))) return run;
  if (run.configured) return advanceConfigured(run, move, text, choice, tookMs, now);
  const queue = run.queue.slice(1);
  const matches = matchingClues(run, move, text);
  const newlyOpened = matches.filter(clue => !run.opened.includes(clue.id));
  if (move.evidence && !move.public && !matches.length && !run.hints[move.id]) {
    return { ...run, requestError: 'Напиши, какие данные тебе нужны и что хочешь сравнить. Если нужна помощь, открой подсказку.' };
  }
  const assessment = assessTurn(run, move, text, choice, matches);
  const target = move.target ? targetEntry(run, move) : null;
  const entry = { id: move.id, phase: move.phase, kind: move.kind, label: move.label, answer: text, choice, choiceLabel: optionLabel(move, choice), assessment, tookMs, opened: newlyOpened.map(clue => clue.id), ...(target ? { targetId: target.id, targetQuote: target.quote } : {}) };
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
      fact: undefined, evidence: undefined, reply: move.id === 'scope' ? move.reply : undefined,
      optional: false, optionLabels: undefined,
    };
    if (existing >= 0) queue.splice(existing, 1);
    queue.unshift(followUp);
    clarified.push(move.phase);
  }
  // Слабый ответ не попадает в карту: интервьюер сначала задаёт уточнение.
  const deferred = queue[0]?.id === `${move.id}_clarify`;
  const nextMap = mapEntry(run, move, text, choice);
  const base = run.map.filter(entry => entry.id !== nextMap.id);
  const map = [...base, ...(deferred ? [] : [nextMap]), ...newlyOpened.map(clue => ({
    id: `evidence_${clue.id}`, phase: move.phase, label: 'Улика', value: clue.title, quote: text,
  }))];
  return {
    ...run, updatedAt: now, queue, history, map, clarified,
    opened: [...run.opened, ...entry.opened], draft: '', choice: '', requestError: '',
    elapsed: run.elapsed + tookMs, status: queue.length ? 'active' : 'finished',
    lastReply: move.reply && assessment.grade >= 2 ? run.seed.replies[move.reply] : '',
  };
}


function advanceConfigured(run, move, text, choice, tookMs, now) {
  if (move.options?.length && !move.options.includes(choice)) return run;
  const target = targetEntry(run, move);
  const next = nextConfiguredTurn(run, move, choice);
  const askAgain = move.kind !== 'CLARIFY' && move.kind !== 'DEMAND' && !move.options
    && move.answerFormat && !run.clarified.includes(move.phase)
    && (text.match(/[\p{L}\p{N}]+/gu)?.length || 0) < 4;
  const clarification = askAgain ? {
    id: `${move.id}_follow_up`, label: 'Уточнение интервьюера', phase: move.phase, kind: 'CLARIFY',
    prompt: move.answerFormat, target: move.id, nextStepId: next?.id,
  } : null;
  const continuation = clarification || next;
  const entry = {
    id: move.id, phase: move.phase, label: move.label, kind: move.kind,
    answer: text, choice, opened: [], tookMs,
    ...(target ? { targetId: target.id, targetQuote: target.quote } : {}),
  };
  return {
    ...run, updatedAt: now, status: continuation ? 'active' : 'finished',
    queue: continuation ? [continuation] : [], history: [...run.history, entry],
    map: [...run.map, mapEntry(run, move, text, choice)],
    clarified: askAgain ? [...run.clarified, move.phase] : run.clarified,
    elapsed: run.elapsed + tookMs, draft: '', choice: '',
  };
}
