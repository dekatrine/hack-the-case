import { guideCaseRoute } from '../cases/caseWriting.js';

export function configuredRun(result, settings, directionLabel, now = Date.now()) {
  const intro = result.caseIntro?.trim();
  const source = result.caseRoute || [];
  if (!intro || !source.length || !source.some(step => step.evidence) || !source.some(step => step.nextByAnswer && Object.keys(step.nextByAnswer).length)) {
    throw new Error('Не удалось подготовить кейс с данными и развилками. Попробуй ещё раз.');
  }
  const title = result.caseText?.split('\n').find(line => line.trim())?.replace(/^#+\s*/, '').trim() || directionLabel;
  const phases = [...new Map(source.map(step => [step.chapter || 1, step.chapterTitle || 'Решение кейса']))]
    .map(([chapter, label]) => ({ id: String(chapter), label }));
  const steps = guideCaseRoute({ title, caseIntro: intro, params: settings }, source);
  const graph = Object.fromEntries(steps.map(step => {
    const kind = step.id === 'variant_final' ? 'DEMAND'
      : step.id === 'variant_twist' ? 'TWIST'
        : /^(variant_gap_[01]|variant_result|variant_tradeoff)$/.test(step.id) ? 'CHALLENGE'
          : step.evidence ? 'DATA' : 'ASK';
    return [step.id, {
      id: step.id, phase: String(step.chapter || 1), label: step.question, prompt: step.question,
      hint: step.hint || '', answerFormat: step.answerFormat || step.hint || '',
      options: step.options?.length ? step.options : undefined,
      nextByAnswer: step.nextByAnswer, nextStepId: step.nextStepId,
      scene: step.scene, caseEvidence: step.evidence, kind, longAnswer: step.longAnswer,
    }];
  }));
  const id = crypto.randomUUID();
  return {
    id, settings, configured: { graph, variantId: result.variantId, fingerprints: result.fingerprints || [] },
    skeleton: { id: 'configured', label: directionLabel, title, phases, minutes: 25, version: 1 },
    seed: { id, industry: settings.industry, intro, profile: 'Марина Орлова', groups: [], scenes: {}, clues: [] },
    queue: [graph[steps[0].id]], history: [], map: [], opened: [], hints: {}, clarified: [],
    choice: '', draft: '', elapsed: 0, status: 'briefing', updatedAt: now, createdAt: now,
  };
}

export function nextConfiguredTurn(run, move, choice) {
  const branch = move.nextByAnswer;
  const id = branch && Object.keys(branch).length
    ? (Object.hasOwn(branch, choice) ? branch[choice] : null)
    : move.nextStepId;
  return id ? run.configured.graph[id] : undefined;
}

export function configuredRemaining(run) {
  let move = run.queue[0];
  const seen = new Set();
  while (move && !seen.has(move.id)) {
    seen.add(move.id);
    move = nextConfiguredTurn(run, move, move.options?.[0]);
  }
  return seen.size;
}

export function configuredReviewPayload(run) {
  const baseSteps = run.history.filter(entry => entry.kind !== 'CLARIFY');
  const clarifications = new Map(run.history.filter(entry => entry.kind === 'CLARIFY').map(entry => [entry.targetId, entry.answer]));
  return {
    caseText: run.seed.intro,
    trackId: 'product', interviewType: run.settings.interviewType, mvp: true,
    answers: Object.fromEntries(baseSteps.map(entry => {
      const detail = clarifications.get(entry.id);
      return [entry.id, detail ? `${entry.answer}\nУточнение: ${detail}` : entry.answer];
    })),
    caseRoute: baseSteps.map(entry => {
      const step = run.configured.graph[entry.id];
      return { id: entry.id, question: step.prompt, hint: step.answerFormat, scene: step.scene || '', evidence: step.caseEvidence || '' };
    }),
    hintedSteps: Object.keys(run.hints),
    hintUsage: { basic: Object.keys(run.hints).length, ai: 0 },
  };
}
