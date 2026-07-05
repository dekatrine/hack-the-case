import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-[#ef5b2a] text-white',
        secondary:'bg-[#f0f2f7] text-[#5a6a85]',
        outline:  'border border-[rgba(15,23,42,0.14)] text-[#17202f] bg-transparent',
        success:  'bg-[#d1fae5] text-[#065f46]',
        warning:  'bg-[#fef3c7] text-[#92400e]',
        error:    'bg-[#fee2e2] text-[#991b1b]',
        accent:   'bg-[#eef2ff] text-[#4338ca]',
        canvas:   'bg-[#1e2d44] text-[#dbe3ef]',
      },
    },
    defaultVariants: { variant: 'secondary' },
  }
);

const Badge = ({ className, variant, ...props }) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
