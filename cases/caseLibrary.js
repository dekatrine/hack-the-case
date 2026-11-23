export function countHints(hints) {
  const usage = { basic: 0, ai: 0 };
  for (const step of Object.values(hints || {})) {
    if (step?.basic) usage.basic += 1;
    usage.ai += step?.ai?.length || 0;
  }
  return usage;
}

export function hasAttemptChanges(item, attempt) {
  if (!attempt) return true;
  const used = countHints(item.hints);
  const previous = attempt.score?.hints;
  return JSON.stringify(item.answers || {}) !== JSON.stringify(attempt.answers || {})
    || used.basic !== (previous?.basic || 0)
    || used.ai !== (previous?.ai || 0);
}

export function caseStatus(item) {
  if (item.archivedAt) return 'archived';
  const reviewed = Array.isArray(item.attempts) && item.attempts.length > 0;
  const latest = reviewed ? item.attempts[item.attempts.length - 1] : null;
  if (reviewed && hasAttemptChanges(item, latest)) return 'draft';
  if (reviewed) return 'reviewed';
  return Object.values(item.answers || {}).some(value => String(value || '').trim()) ? 'draft' : 'new';
}
export function answeredCount(item) {
  return Object.values(item.answers || {}).filter(value => String(value || '').trim()).length;
}
export function caseStats(cases) {
  const active = cases.filter(item => !item.archivedAt);
  return {
    total: active.length,
    reviewed: active.filter(item => caseStatus(item) === 'reviewed').length,
    inProgress: active.filter(item => ['draft','new'].includes(caseStatus(item))).length,
    archived: cases.length - active.length,
  };
}
export function filterCases(cases, { query = '', status = 'active', type = 'all', sort = 'recent' } = {}) {
  const needle = query.toLocaleLowerCase('ru-RU').trim();
  const filtered = cases.filter(item => {
    const current = caseStatus(item);
    const statusMatch = status === 'active' ? current !== 'archived' : status === 'all' ? true : status === 'inprogress' ? ['new','draft'].includes(current) : current === status;
    const typeMatch = type === 'all' || item.params?.interviewType === type;
    const text = [item.title, item.caseText, item.params?.industry].filter(Boolean).join(' ').toLocaleLowerCase('ru-RU');
    return statusMatch && typeMatch && (!needle || text.includes(needle));
  });
  return filtered.sort((a,b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt || 0) || 0;
    const bTime = Date.parse(b.updatedAt || b.createdAt || 0) || 0;
    return sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });
}
export function duplicateAsNewAttempt(item, id, date) {
  return {
    ...item, id, answers: {}, hints: {}, attempts: [], currentQuestionId: null,
    archivedAt: null, createdAt: date, updatedAt: date, sourceCaseId: item.id
  };
}
