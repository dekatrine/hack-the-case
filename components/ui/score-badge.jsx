import React from 'react';
import { cn } from '../../lib/utils';

const getScoreConfig = (score) => {
  if (score >= 80) return { color: 'text-[#065f46]', bg: 'bg-[#d1fae5]', ring: 'ring-[#a7f3d0]', label: 'Отлично' };
  if (score >= 60) return { color: 'text-[#92400e]', bg: 'bg-[#fef3c7]', ring: 'ring-[#fde68a]', label: 'Хорошо' };
  return { color: 'text-[#991b1b]', bg: 'bg-[#fee2e2]', ring: 'ring-[#fca5a5]', label: 'Нужна работа' };
};

const ScoreBadge = ({ score, maxScore = 100, className }) => {
  const cfg = getScoreConfig(score);
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn(
        'w-28 h-28 rounded-full flex flex-col items-center justify-center ring-4',
        cfg.bg, cfg.ring,
      )}>
        <span className={cn('text-4xl font-bold tabular-nums', cfg.color)}>{score}</span>
        <span className={cn('text-xs font-medium', cfg.color)}>/ {maxScore}</span>
      </div>
      <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', cfg.bg, cfg.color)}>
        {cfg.label}
      </span>
    </div>
  );
};

export { ScoreBadge };
