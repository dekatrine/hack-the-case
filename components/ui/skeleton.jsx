import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => (
  <div
    className={cn('animate-pulse rounded-lg bg-[#f0f2f7]', className)}
    {...props}
  />
);

export { Skeleton };
