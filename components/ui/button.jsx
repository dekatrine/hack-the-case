import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef5b2a] disabled:opacity-45 disabled:pointer-events-none active:scale-95',
  {
    variants: {
      variant: {
        default:  'bg-[#ef5b2a] text-white border border-[#ef5b2a] hover:bg-[#d44b1f] hover:shadow-lg hover:-translate-y-px',
        outline:  'border border-[rgba(15,23,42,0.14)] bg-white text-[#17202f] hover:bg-[#f7f8fb]',
        ghost:    'text-[#17202f] hover:bg-[rgba(15,23,42,0.06)] border border-transparent',
        canvas:   'text-[#dbe3ef] hover:bg-white/10 border border-transparent',
        accent:   'bg-[#6366f1] text-white border border-[#6366f1] hover:bg-indigo-700',
      },
      size: {
        sm:   'px-3 py-1.5 text-xs',
        default: 'px-4 py-2.5',
        lg:   'px-6 py-3 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
