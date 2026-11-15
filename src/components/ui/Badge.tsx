import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'green' | 'amber' | 'rose' | 'slate';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  green: 'bg-leaf-50 text-leaf-700 ring-leaf-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function Badge({ children, tone = 'brand', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
