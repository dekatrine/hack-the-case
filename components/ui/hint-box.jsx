import React from 'react';
import { cn } from '../../lib/utils';

const ICONS = {
  tip:     '💡',
  warning: '⚠️',
  info:    'ℹ️',
  success: '✅',
  ai:      '🤖',
};

const HintBox = ({ type = 'tip', title, children, className }) => (
  <div className={cn(
    'rounded-xl border px-4 py-3 flex gap-3',
    type === 'tip'     && 'bg-[#fff4f0] border-[#ffd3bc]',
    type === 'warning' && 'bg-[#fef3c7] border-[#fde68a]',
    type === 'info'    && 'bg-[#eef2ff] border-[#c7d2fe]',
    type === 'success' && 'bg-[#d1fae5] border-[#a7f3d0]',
    type === 'ai'      && 'bg-[#f5f3ff] border-[#ddd6fe]',
    className,
  )}>
    <span className="text-base flex-shrink-0 mt-0.5">{ICONS[type]}</span>
    <div className="flex flex-col gap-0.5">
      {title && <p className="text-sm font-semibold text-[#17202f]">{title}</p>}
      <div className="text-sm text-[#5a6a85] leading-relaxed">{children}</div>
    </div>
  </div>
);

export { HintBox };
