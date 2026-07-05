import React from 'react';
import { cn } from '../../lib/utils';

const StepIndicator = ({ steps, activeIdx, answers = {}, onPick }) => {
  const doneCount = steps.filter((s) => (answers[s.id] || '').trim().length > 30).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <aside className="step-indicator-panel">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#5a6a85]">Прогресс</span>
        <span className="text-xs font-mono text-[#ef5b2a]">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f0f2f7] mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#ef5b2a] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-col gap-1">
        {steps.map((step, i) => {
          const done = (answers[step.id] || '').trim().length > 30;
          const active = i === activeIdx;
          return (
            <button
              key={step.id}
              onClick={() => onPick?.(i)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150',
                active && 'bg-[#fff4f0] text-[#ef5b2a]',
                !active && done && 'text-[#5a6a85] hover:bg-[#f7f8fb]',
                !active && !done && 'text-[#9aaabb] hover:bg-[#f7f8fb]',
              )}
            >
              <span className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                active && 'bg-[#ef5b2a] text-white',
                !active && done && 'bg-[#d1fae5] text-[#065f46]',
                !active && !done && 'border border-[rgba(15,23,42,0.12)] text-[#9aaabb]',
              )}>
                {done && !active ? '✓' : i + 1}
              </span>
              <span className="text-sm font-medium leading-tight">{step.title}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export { StepIndicator };
