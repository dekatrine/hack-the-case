export const hasStory = route => !!route?.[0]?.chapter;
const answerPlural = new Intl.PluralRules('ru');
export const answerCountLabel = count => `${count} ${({ one: 'ответ', few: 'ответа', many: 'ответов' })[answerPlural.select(count)] || 'ответа'}`;

export function storyPath(route, answers) {
  const byId = new Map(route.map(step => [step.id, step]));
  const path = [];
  const seen = new Set();
  let step = route[0];
  while (step && !seen.has(step.id)) {
    seen.add(step.id);
    path.push(step);
    const next = Object.keys(step.nextByAnswer || {}).length
      ? Object.hasOwn(step.nextByAnswer, answers[step.id]) && step.nextByAnswer[answers[step.id]]
      : step.nextStepId;
    step = byId.get(next);
  }
  return path;
}

export function storyAnswers(path, answers, key, value) {
  const index = path.findIndex(step => step.id === key);
  if (index < 0 || !Object.keys(path[index].nextByAnswer || {}).length || answers[key] === value) {
    return { ...answers, [key]: value };
  }
  const earlier = path.slice(0, index).filter(step => Object.hasOwn(answers, step.id));
  return { ...Object.fromEntries(earlier.map(step => [step.id, answers[step.id]])), [key]: value };
}
